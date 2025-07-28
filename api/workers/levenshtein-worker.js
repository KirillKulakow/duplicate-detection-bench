const { parentPort, workerData } = require('worker_threads');

class LevenshteinProcessor {
  constructor() {
    this.memo = new Map();
  }

  levenshteinDistance(str1, str2) {
    const key = `${str1}|${str2}`;
    if (this.memo.has(key)) {
      return this.memo.get(key);
    }

    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;

    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i] + 1,
            matrix[j][i - 1] + 1,
            matrix[j - 1][i - 1] + 1
          );
        }
      }
    }

    const distance = matrix[str2.length][str1.length];
    this.memo.set(key, distance);
    return distance;
  }

  calculateSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  processData(data, threshold = 0.8) {
    const duplicates = [];
    const totalComparisons = (data.length * (data.length - 1)) / 2;
    let completedComparisons = 0;

    parentPort.postMessage({
      type: 'progress',
      progress: 5,
      status: 'Preparing data for Levenshtein comparison...'
    });

    const normalizedData = data.map((item, index) => ({
      index,
      original: item,
      normalized: this.normalizeText(Object.values(item).join(' '))
    }));

    parentPort.postMessage({
      type: 'progress',
      progress: 10,
      status: 'Starting pairwise comparisons...'
    });

    for (let i = 0; i < normalizedData.length - 1; i++) {
      for (let j = i + 1; j < normalizedData.length; j++) {
        const similarity = this.calculateSimilarity(
          normalizedData[i].normalized,
          normalizedData[j].normalized
        );

        if (similarity >= threshold) {
          duplicates.push({
            item1: normalizedData[i].original,
            item2: normalizedData[j].original,
            similarity: similarity,
            distance: this.levenshteinDistance(
              normalizedData[i].normalized,
              normalizedData[j].normalized
            ),
            indices: [normalizedData[i].index, normalizedData[j].index]
          });
        }

        completedComparisons++;
        
        if (completedComparisons % 250 === 0) {
          const progress = 10 + (completedComparisons / totalComparisons) * 80;
          parentPort.postMessage({
            type: 'progress',
            progress: Math.round(progress),
            status: `Processed ${completedComparisons}/${totalComparisons} comparisons...`
          });
        }
      }
    }

    duplicates.sort((a, b) => b.similarity - a.similarity);

    return {
      algorithm: 'Levenshtein Distance',
      threshold,
      totalItems: data.length,
      duplicatesFound: duplicates.length,
      duplicates: duplicates.slice(0, 50),
      totalComparisons: completedComparisons,
      cacheSize: this.memo.size
    };
  }
}

try {
  const { data } = workerData;
  const processor = new LevenshteinProcessor();
  
  parentPort.postMessage({
    type: 'progress',
    progress: 0,
    status: 'Initializing Levenshtein processor...'
  });

  const startTime = process.hrtime.bigint();
  const result = processor.processData(data);
  const endTime = process.hrtime.bigint();
  
  result.executionTime = Number(endTime - startTime) / 1000000;

  parentPort.postMessage({
    type: 'progress',
    progress: 100,
    status: 'Levenshtein processing complete!'
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