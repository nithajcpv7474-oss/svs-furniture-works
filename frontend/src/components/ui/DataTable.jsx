import React, { useState, useMemo, useContext } from 'react';
import { 
  ChevronLeft, ChevronRight, Inbox, Search, Download, 
  Settings2, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet, File
} from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const DataTable = ({ 
  columns: initialColumns, 
  data, 
  keyField = 'id', 
  onRowClick,
  isLoading = false,
  exportFilename = "Export",
  exportTitle = "Report",
  selectable = false,
  onSelectionChange,
  rowClassName
}) => {
  const { user } = useContext(AuthContext) || {};
  const [columns, setColumns] = useState(initialColumns.map(c => ({...c, hidden: false})));
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selection State
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Show/Hide Columns Dropdown State
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Sorting Logic
  const handleSort = (accessor) => {
    if (!accessor) return;
    let direction = 'asc';
    if (sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: accessor, direction });
  };

  // Selection Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredAndSortedData.map(row => row[keyField]));
      setSelectedRowIds(allIds);
      if(onSelectionChange) onSelectionChange(Array.from(allIds));
    } else {
      setSelectedRowIds(new Set());
      if(onSelectionChange) onSelectionChange([]);
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRowIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRowIds(newSelected);
    if(onSelectionChange) onSelectionChange(Array.from(newSelected));
  };

  // Processing Data: Filter -> Sort -> Paginate
  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];

    // Global Search Filter
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      processedData = processedData.filter(row => {
        return columns.some(col => {
          if (col.hidden || !col.accessor) return false;
          const val = row[col.accessor];
          return val && String(val).toLowerCase().includes(lowerFilter);
        });
      });
    }

    // Sort
    if (sortConfig.key) {
      processedData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processedData;
  }, [data, globalFilter, sortConfig, columns]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedData.slice(start, start + rowsPerPage);
  }, [filteredAndSortedData, currentPage, rowsPerPage]);

  // Ensure page resets if filter changes significantly
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const toggleColumnVisibility = (accessor) => {
    setColumns(cols => cols.map(c => c.accessor === accessor ? { ...c, hidden: !c.hidden } : c));
  };

  const visibleColumns = columns.filter(c => !c.hidden);

  const handleExport = async (type) => {
    // If rows are selected, export only those. Else export all filtered data.
    const exportData = selectedRowIds.size > 0 
      ? filteredAndSortedData.filter(row => selectedRowIds.has(row[keyField]))
      : filteredAndSortedData;

    try {
      if (type === 'excel') await exportToExcel(exportData, columns, exportFilename, exportTitle, user);
      if (type === 'pdf') exportToPDF(exportData, columns, exportFilename, exportTitle, user);
      if (type === 'csv') exportToCSV(exportData, columns, exportFilename);
    } catch (error) {
      console.error(`Export failed for type ${type}:`, error);
      if (type === 'pdf') {
        toast.error('Unable to export PDF.');
      } else {
        toast.error(`Unable to export ${type.toUpperCase()}.`);
      }
    }
    setShowExportDropdown(false);
  };

  return (
    <div className="w-full card-premium overflow-visible flex flex-col">
      
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-t-2xl z-20 relative">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search all columns..." 
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedRowIds.size > 0 && (
            <span className="text-sm text-primary font-medium mr-2">
              {selectedRowIds.size} selected
            </span>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="btn-secondary py-2 px-3 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-30">
                <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-600"/> Excel (.xlsx)</button>
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><FileText className="w-4 h-4 text-red-500"/> PDF Document</button>
                <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 flex items-center gap-2"><File className="w-4 h-4 text-slate-500 dark:text-slate-400"/> CSV File</button>
              </div>
            )}
          </div>

          {/* Column Visibility Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="btn-secondary py-2 px-3 text-sm"
            >
              <Settings2 className="w-4 h-4" /> Columns
            </button>
            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 z-30 max-h-64 overflow-y-auto">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">Toggle Columns</div>
                {columns.map((col, idx) => col.accessor && (
                  <label key={idx} className="flex items-center px-4 py-1.5 hover:bg-slate-50 dark:bg-slate-950 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!col.hidden} 
                      onChange={() => toggleColumnVisibility(col.accessor)}
                      className="mr-3 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{col.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto custom-scrollbar flex-1 relative z-10">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/60 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md">
            <tr>
              {selectable && (
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={filteredAndSortedData.length > 0 && selectedRowIds.size === filteredAndSortedData.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                  />
                </th>
              )}
              {visibleColumns.map((col, idx) => (
                <th 
                  key={idx} 
                  onClick={() => handleSort(col.accessor)}
                  className={`px-6 py-4 whitespace-nowrap group ${col.className || ''} ${col.accessor ? 'cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.accessor && sortConfig.key === col.accessor && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                    )}
                    {col.accessor && sortConfig.key !== col.accessor && (
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton
              [...Array(rowsPerPage)].map((_, i) => (
                <tr key={`skel-${i}`} className="border-b border-slate-100 dark:border-slate-800/60">
                  {selectable && <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>}
                  {visibleColumns.map((_, j) => (
                    <td key={`skel-td-${j}`} className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                      <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200 tracking-tight">No records found</p>
                    <p className="text-sm mt-1.5 text-slate-500 font-medium max-w-sm">We couldn't find any data matching your current filters or search criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={row[keyField] || rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`table-row-hover border-b border-slate-100 dark:border-slate-800/60 last:border-0 ${onRowClick ? 'cursor-pointer' : ''} ${selectedRowIds.has(row[keyField]) ? 'bg-primary/5 dark:bg-primary/10' : 'bg-white dark:bg-slate-900/50'} ${rowClassName ? (typeof rowClassName === 'function' ? rowClassName(row) : rowClassName) : ''}`}
                >
                  {selectable && (
                    <td className="px-6 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={selectedRowIds.has(row[keyField])}
                        onChange={() => handleSelectRow(row[keyField])}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                    </td>
                  )}
                  {visibleColumns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-medium ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && filteredAndSortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/60 gap-4 rounded-b-2xl">
          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-4">
            <div>
              Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredAndSortedData.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{filteredAndSortedData.length}</span> results
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
              <span>Rows per page:</span>
              <select 
                value={rowsPerPage} 
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 px-2 min-w-[5rem] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
