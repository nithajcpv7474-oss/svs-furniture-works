import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { logClientExport } from '../services/audit.service';

// A tiny placeholder logo (blue square) - In production, replace with actual SVS Furniture logo
const COMPANY_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY3jP4PgfAAWgA4wXq6aHAAAAAElFTkSuQmCC";
const COMPANY_NAME = "Sri Venkata Sai Furniture Works";

const getExportMetadata = (title, user) => {
  return {
    title,
    date: new Date().toLocaleString(),
    generatedBy: user?.fullName || 'System User'
  };
};

export const exportToCSV = (data, columns, filename) => {
  const visibleColumns = columns.filter(col => !col.hidden && col.accessor);
  
  // Transform data
  const exportData = data.map(row => {
    const newRow = {};
    visibleColumns.forEach(col => {
      let value = row[col.accessor];
      // Basic formatting for objects/arrays
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      newRow[col.header] = value || '';
    });
    return newRow;
  });

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  
  logClientExport('Export', `Exported CSV: ${filename}`);
};

export const exportToExcel = async (data, columns, filename, title, user) => {
  const meta = getExportMetadata(title, user);
  const visibleColumns = columns.filter(col => !col.hidden && col.accessor);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Add Company Header
  worksheet.mergeCells('A1', 'D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = COMPANY_NAME;
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E293B' } };

  worksheet.mergeCells('A2', 'D2');
  worksheet.getCell('A2').value = `Report: ${meta.title}`;
  worksheet.getCell('A2').font = { size: 12, bold: true };

  worksheet.mergeCells('A3', 'D3');
  worksheet.getCell('A3').value = `Generated: ${meta.date} | By: ${meta.generatedBy}`;
  worksheet.getCell('A3').font = { size: 10, italic: true, color: { argb: 'FF64748B' } };

  worksheet.addRow([]); // Empty row for spacing

  // Define Columns
  worksheet.columns = visibleColumns.map(col => ({
    header: col.header,
    key: col.accessor,
    width: Math.max(col.header.length * 1.5, 15) // Dynamic width
  }));

  // Style Header Row
  const headerRow = worksheet.getRow(5);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Primary blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  // Add Data
  data.forEach(row => {
    const rowData = {};
    visibleColumns.forEach(col => {
      rowData[col.accessor] = typeof row[col.accessor] === 'object' ? JSON.stringify(row[col.accessor]) : row[col.accessor];
    });
    worksheet.addRow(rowData);
  });

  // Borders
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 5) {
      row.eachCell((cell) => {
        cell.border = {
          top: {style:'thin', color: {argb:'FFE2E8F0'}},
          left: {style:'thin', color: {argb:'FFE2E8F0'}},
          bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
          right: {style:'thin', color: {argb:'FFE2E8F0'}}
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

  logClientExport('Export', `Exported Excel: ${title}`);
};

export const exportToPDF = (data, columns, filename, title, user) => {
  const meta = getExportMetadata(title, user);
  const visibleColumns = columns.filter(col => !col.hidden && col.accessor);

  const doc = new jsPDF('landscape');
  
  // Header section
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(COMPANY_NAME, 14, 16);
  
  doc.setFontSize(12);
  doc.text(`Report: ${meta.title}`, 14, 28);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${meta.date} | By: ${meta.generatedBy}`, 14, 34);

  // Table
  const tableHeaders = visibleColumns.map(col => col.header);
  const tableData = data.map(row => {
    return visibleColumns.map(col => {
      let val = row[col.accessor];
      return typeof val === 'object' && val !== null ? JSON.stringify(val) : (val || '-');
    });
  });

  autoTable(doc, {
    startY: 40,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 40 },
    didDrawPage: function (data) {
      // Page numbers at the bottom
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    }
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

  logClientExport('Export', `Exported PDF: ${title}`);
};

export const printReport = () => {
  window.print();
};
