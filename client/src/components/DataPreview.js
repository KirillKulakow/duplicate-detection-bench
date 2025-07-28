import React from 'react';
import { Eye, Database, Hash } from 'lucide-react';

const DataPreview = ({ data }) => {
  if (!data || data.length === 0) return null;

  const fields = Object.keys(data[0]);

  return (
    <div className="data-preview">
      <div className="preview-header">
        <Eye className="preview-icon" />
        <div className="preview-title">
          <h4>Data Preview</h4>
          <p>First 5 records from your dataset</p>
        </div>
        <div className="preview-stats">
          <div className="stat-item">
            <Database className="stat-icon" />
            <span>{data.length} Records</span>
          </div>
          <div className="stat-item">
            <Hash className="stat-icon" />
            <span>{fields.length} Fields</span>
          </div>
        </div>
      </div>

      <div className="preview-table">
        <div className="table-header">
          {fields.map((field, index) => (
            <div key={index} className="table-header-cell">
              {field}
            </div>
          ))}
        </div>
        <div className="table-body">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="table-row">
              {fields.map((field, cellIndex) => (
                <div key={cellIndex} className="table-cell">
                  {row[field]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataPreview;