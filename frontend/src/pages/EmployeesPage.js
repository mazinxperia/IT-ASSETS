import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Users as UsersIcon,
  Package
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingPage } from '../components/common/LoadingSpinner';
import { ExportDropdown } from '../components/common/ExportDropdown';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ModernEmployeesPage() {
  const navigate = useNavigate();
  const { isReadOnly } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => {
      if (emp.name?.toLowerCase().includes(query)) return true;
      if (emp.employeeId?.toLowerCase().includes(query)) return true;
      const fv = emp.fieldValues || {};
      return Object.values(fv).some(v => String(v).toLowerCase().includes(query));
    });
  }, [employees, searchQuery]);

  const handleDelete = async () => {
    if (!deleteDialog.employee) return;
    
    try {
      await employeesAPI.delete(deleteDialog.employee.id);
      setEmployees(prev => prev.filter(e => e.id !== deleteDialog.employee.id));
      toast.success('Employee deleted successfully');
    } catch (error) {
      toast.error('Failed to delete employee');
    } finally {
      setDeleteDialog({ open: false, employee: null });
    }
  };

  const handleExport = (sendEmail) => {
    return employeesAPI.export(sendEmail);
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Employees"
        description={`Manage all ${employees.length} employees`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ExportDropdown onExport={handleExport} />
            {!isReadOnly && (
              <Button onClick={() => navigate('/employees/new')} data-testid="add-employee-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            )}
          </div>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employees Table */}
      {filteredEmployees.length === 0 ? (
        <EmptyState 
          icon={UsersIcon}
          title="No employees found"
          description="Get started by adding your first employee"
          action={
            !isReadOnly && (
              <Button onClick={() => navigate('/employees/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            )
          }
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Assets Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow 
                  key={employee.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/employees/${employee.id}`)}
                >
                  <TableCell className="font-medium">
                    {employee.employeeId}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{employee.name}</div>
                    {employee.fieldValues?.Email && (
                      <div className="text-sm text-muted-foreground">{employee.fieldValues.Email}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {employee._count?.assets || 0} {(employee._count?.assets || 0) === 1 ? 'asset' : 'assets'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); navigate(`/employees/${employee.id}`); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!isReadOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); navigate(`/employees/${employee.id}/edit`); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, employee }); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, employee: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete employee <strong>{deleteDialog.employee?.name}</strong>? All assigned assets will be moved to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
