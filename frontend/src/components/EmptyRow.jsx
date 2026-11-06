import { TableCell, TableRow, Typography } from '@mui/material';

export default function EmptyRow({ colSpan, message = 'No records found.' }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
