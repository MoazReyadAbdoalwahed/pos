import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    children: React.ReactNode;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    children: React.ReactNode;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    children: React.ReactNode;
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
    ({ className = '', ...props }, ref) => (
        <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...props} />
    )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
    ({ className = '', ...props }, ref) => (
        <thead ref={ref} className={`border-b border-slate-800 bg-slate-900/50 ${className}`} {...props} />
    )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
    ({ className = '', ...props }, ref) => (
        <tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
    )
);
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className = '', ...props }, ref) => (
        <tr
            ref={ref}
            className={`border-b border-slate-800/40 transition-colors hover:bg-slate-800/20 ${className}`}
            {...props}
        />
    )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className = '', ...props }, ref) => (
        <th
            ref={ref}
            className={`h-12 px-4 text-left align-middle font-semibold text-slate-400 [&:has([role=checkbox])]:pr-0 ${className}`}
            {...props}
        />
    )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className = '', ...props }, ref) => (
        <td ref={ref} className={`px-4 py-2 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
    )
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
