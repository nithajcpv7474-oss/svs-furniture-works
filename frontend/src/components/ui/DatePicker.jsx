import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

export const DatePicker = ({ 
  selected, 
  onChange, 
  placeholderText = "Select date", 
  className = "", 
  wrapperClassName = "",
  ...props 
}) => {
  return (
    <div className={`relative w-full ${wrapperClassName}`}>
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={16} />
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholderText}
        className={`w-full pl-9 pr-3 py-2 ${className}`}
        {...props}
      />
    </div>
  );
};
