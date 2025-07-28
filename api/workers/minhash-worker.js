const { parentPort, workerData } = require('worker_threads');

class MinHashProcessor {
  constructor(numHashFunctions = 64) { // Reduced for serverless
    this.numHashFunctions = numHashFunctions;
    this.hashFunctions = this.generateHashFunctions();
  }

  generateHashFunctions() {
    const functions = [];
    for (let i = 0; i < this.numHashFunctions; i++) {
      const a = Math.floor(Math.random() * 1000000) + 1;
      const b = Math.floor(Math.random() * 1000000);
      functions.push({ a, b });
    }
    return functions;
  }

  textToShingles(text, shingleSize = 3) {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const shingles = new Set();
    
    for (let i = 0; i <= cleanText.length - shingleSize; i++) {
      shingles.add(cleanText.substring(i, i + shingleSize));
    }
    
    return shingles;
  }

  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  generateMinHashSignature(shingles) {
    const signature = new Array(this.numHashFunctions).fill(Infinity);
    
    for (const shingle of shingles) {
      const baseHash = this.hash(shingle);
      
      for (let i = 0; i < this.numHashFunctions; i++) {
        const { a, b } = this.hashFunctions[i];
        const hashValue = (a * baseHash + b) % 2147483647;
        signature[i] = Math.min(signature[i], hashValue);
      }
    }
    
    return signature;
  }

  calculateJaccardSimilarity(sig1, sig2) {
    let matches = 0;
    for (let i = 0; i < sig1.length; i++) {
      if (sig1[i] === sig2[i]) {
        matches++;
      }
    }
    return matches / sig1.length;
  }

  processData(data, threshold = 0.7) {
    const signatures = [];
    const duplicates = [];
    const totalComparisons = (data.length * (data.length - 1)) / 2;
    let completedComparisons = 0;

    parentPort.postMessage({
      type: 'progress',
      progress: 10,
      status: 'Generating MinHash signatures...'
    });

    for (let i = 0; i < data.length; i++) {
      const textFields = Object.values(data[i]).join(' ');
      const shingles = this.textToShingles(textFields);
      const signature = this.generateMinHashSignature(shingles);
      signatures.push({ index: i, signature, original: data[i] });
      
      if (i % 50 === 0) {
        const progress = 10 + (i / data.length) * 40;
        parentPort.postMessage({
          type: 'progress',
          progress: Math.round(progress),
          status: `Generated ${i}/${data.length} signatures...`
        });
      }
    }

    parentPort.postMessage({
      type: 'progress',
      progress: 50,
      status: 'Comparing signatures...'
    });

    for (let i = 0; i < signatures.length - 1; i++) {
      for (let j = i + 1; j < signatures.length; j++) {
        const similarity = this.calculateJaccardSimilarity(
          signatures[i].signature,
          signatures[j].signature
        );

        if (similarity >= threshold) {
          duplicates.push({
            item1: signatures[i].original,
            item2: signatures[j].original,
            similarity: similarity,
            indices: [signatures[i].index, signatures[j].index]
          });
        }

        completedComparisons++;
        if (completedComparisons % 500 === 0) {
          const progress = 50 + (completedComparisons / totalComparisons) * 40;
          parentPort.postMessage({
            type: 'progress',
            progress: Math.round(progress),
            status: `Compared ${completedComparisons}/${totalComparisons} pairs...`
          });
        }
      }
    }

    return {
      algorithm: 'MinHash (Jaccard Similarity)',
      threshold,
      totalItems: data.length,
      duplicatesFound: duplicates.length,
      duplicates: duplicates.slice(0, 50),
      executionTime: process.hrtime.bigint()
    };
  }
}

try {
  const { data } = workerData;
  const processor = new MinHashProcessor();
  
  parentPort.postMessage({
    type: 'progress',
    progress: 0,
    status: 'Initializing MinHash processor...'
  });

  const startTime = process.hrtime.bigint();
  const result = processor.processData(data);
  const endTime = process.hrtime.bigint();
  
  result.executionTime = Number(endTime - startTime) / 1000000;

  parentPort.postMessage({
    type: 'progress',
    progress: 100,
    status: 'MinHash processing complete!'
  });

  parentPort.postMessage({
    type: 'result',
    result
  });

} catch (error) {
  parentPort.postMessage({
    type: 'error',
    error: error.message
  });
}