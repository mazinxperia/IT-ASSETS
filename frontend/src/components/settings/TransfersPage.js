import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftRight,
  Users,
  Boxes,
  Package,
  ChevronRight,
  Check,
  ArrowRight,
  Plus,
  Download,
  History,
  FileText,
  Trash2,
  X
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { TransferStepper } from '../components/common/TransferStepper';
import { LoadingPage } from '../components/common/LoadingSpinner';
import { ManualTransferDialog } from '../components/common/ManualTransferDialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Checkbox } from '../components/ui/checkbox';
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
import { employeesAPI, assetsAPI, transfersAPI, assetTypesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cn, downloadCSV } from '../lib/utils';
import { toast } from 'sonner';

const STEPS = [
  { id: 'source', label: 'Select Source' },
  { id: 'assets', label: 'Select Assets' },
  { id: 'destination', label: 'Select Destination' },
  { id: 'confirm', label: 'Confirm' }
];

// Note popup component
function NotePopup({ note, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="bg-card border border-border rounded-xl p-5 max-w-md w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Transfer Note
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function TransfersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isReadOnly } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [notePopup, setNotePopup] = useState(null); // note string
  const [deleteTransferId, setDeleteTransferId] = useState(null);

  // Transfer state
  const [sourceType, setSourceType] = useState(null);
  const [sourceEmployee, setSourceEmployee] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [destinationType, setDestinationType] = useState(null);
  const [destinationEmployee, setDestinationEmployee] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const getModelNumber = (asset) => {
    if (!asset) return '';
    // Check fieldValues using assetType field definitions
    if (asset.fieldValues && asset.assetType?.fields) {
      const mf = asset.assetType.fields.find(f => f.name === 'Model Number');
      if (mf && asset.fieldValues[mf.id]) return asset.fieldValues[mf.id];
    }
    // Fallback: check assetTypes state
    if (!asset.fieldValues) return '';
    const at = assetTypes.find(t => t.id === asset.assetTypeId);
    if (!at) return '';
    const mf = (at.fields || []).find(f => f.name === 'Model Number');
    if (!mf) return '';
    return asset.fieldValues[mf.id] || '';
  };

  // Get model number from a transfer record (uses stored assetModelNumber or live asset)
  const getTransferModel = (transfer) => {
    if (transfer.assetModelNumber) return transfer.assetModelNumber;
    if (transfer.asset) return getModelNumber(transfer.asset);
    return '';
  };

  async function fetchData() {
    try {
      const [employeesRes, inventoryRes, transfersRes, typesRes] = await Promise.all([
        employeesAPI.getAll(),
        assetsAPI.getInventory(),
        transfersAPI.getAll(),
        assetTypesAPI.getAll()
      ]);
      setEmployees(employeesRes.data);
      setInventory(inventoryRes.data);
      setTransfers(transfersRes.data);
      setAssetTypes(typesRes.data || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const fetchEmployeeAssets = async (employeeId) => {
    setLoadingAssets(true);
    try {
      const response = await employeesAPI.getAssignedAssets(employeeId);
      setEmployeeAssets(response.data);
    } catch (error) {
      toast.error('Failed to load employee assets');
      setEmployeeAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!deleteTransferId) return;
    try {
      await transfersAPI.delete(deleteTransferId);
      setTransfers(prev => prev.filter(t => t.id !== deleteTransferId));
      toast.success('Transfer record deleted');
    } catch {
      toast.error('Failed to delete transfer');
    } finally {
      setDeleteTransferId(null);
    }
  };

  const availableAssets = sourceType === 'inventory' ? inventory : employeeAssets;

  const handleSourceSelect = async (type, employeeId = null) => {
    setSourceType(type);
    setSourceEmployee(employeeId);
    setSelectedAssets([]);
    if (type === 'employee' && employeeId) {
      await fetchEmployeeAssets(employeeId);
    }
    setCurrentStep(1);
  };

  const handleAssetToggle = (assetId) => {
    setSelectedAssets(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleDestinationSelect = (type, employeeId = null) => {
    setDestinationType(type);
    setDestinationEmployee(employeeId);
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await transfersAPI.create({
        assetIds: selectedAssets,
        fromType: sourceType,
        fromId: sourceEmployee,
        toType: destinationType,
        toId: destinationEmployee,
        notes
      });
      toast.success('Transfer completed successfully!');
      setCurrentStep(0);
      setSourceType(null);
      setSourceEmployee(null);
      setSelectedAssets([]);
      setDestinationType(null);
      setDestinationEmployee(null);
      setNotes('');
      fetchData();
    } catch (error) {
      toast.error('Failed to complete transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const exportData = transfers.map(t => ({
      'Date': new Date(t.date).toLocaleDateString(),
      'Model Number': getTransferModel(t) || 'N/A',
      'Asset Type': t.assetTypeName || t.asset?.assetType?.name || 'N/A',
      'From': t.fromName,
      'To': t.toName,
      'Notes': t.notes || ''
    }));
    downloadCSV(exportData, 'transfers');
    toast.success('Transfers exported successfully');
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  if (loading) return <LoadingPage />;

  const contentVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div data-testid="transfers-page">
      <PageHeader
        title="Transfers"
        description="Transfer assets between employees or inventory"
        actions={
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <Button variant="outline" size="sm" onClick={() => setShowManualDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manual History
              </Button>
            )}
            <Button
              variant={showHistory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? 'Hide History' : 'Transfer History'}
              {transfers.length > 0 && (
                <Badge variant="secondary" className="ml-2">{transfers.length}</Badge>
              )}
            </Button>
            {showHistory && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        }
      />

      {/* Transfer History */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Transfer History
              </CardTitle>
              <CardDescription>All asset transfers</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Model Number</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-center">Note</TableHead>
                  {!isReadOnly && <TableHead className="text-center">Delete</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.length > 0 ? (
                  transfers.map((transfer) => {
                    const modelNum = getTransferModel(transfer);
                    const assetTypeName = transfer.assetTypeName || transfer.asset?.assetType?.name || '';
                    return (
                      <TableRow key={transfer.id} data-testid={`transfer-row-${transfer.id}`}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium text-sm">
                            {transfer.formattedDate
                              ? transfer.formattedDate.split(' – ')[0]
                              : new Date(transfer.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transfer.formattedDate
                              ? transfer.formattedDate.split(' – ')[1]
                              : new Date(transfer.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{modelNum || <span className="text-muted-foreground">—</span>}</div>
                          {assetTypeName && (
                            <div className="text-xs text-muted-foreground">{assetTypeName}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs px-1.5">{transfer.fromType || 'employee'}</Badge>
                            <span className="text-sm">{transfer.fromName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs px-1.5">{transfer.toType || 'employee'}</Badge>
                            <span className="text-sm">{transfer.toName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {transfer.notes ? (
                            <button
                              onClick={() => setNotePopup(transfer.notes)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                              title="View note"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell className="text-center">
                            <button
                              onClick={() => setDeleteTransferId(transfer.id)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                              title="Delete transfer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isReadOnly ? 5 : 6} className="text-center py-8 text-muted-foreground">
                      No transfer history
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}

      {/* Transfer Stepper */}
      {!isReadOnly && (
        <>
          <TransferStepper steps={STEPS} currentStep={currentStep} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              {/* Step 1: Select Source */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="step-source">
                  <Card
                    className="cursor-pointer transition-all duration-200 hover:-translate-y-1 dark:border-border"
                    onClick={() => handleSourceSelect('inventory')}
                    data-testid="select-source-inventory"
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-chart-2/10 flex items-center justify-center">
                        <Boxes className="w-7 h-7 text-chart-2" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg">From Inventory</h3>
                        <p className="text-muted-foreground">{inventory.length} assets available</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer transition-all duration-200 hover:-translate-y-1 dark:border-border"
                    onClick={() => setSourceType('selectEmployee')}
                    data-testid="select-source-employee"
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg">From Employee</h3>
                        <p className="text-muted-foreground">Transfer from an employee</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>

                  {sourceType === 'selectEmployee' && (
                    <div className="col-span-full mt-4">
                      <Card className="dark:border-border">
                        <CardHeader>
                          <CardTitle>Select Source Employee</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {employees.map(employee => (
                              <button
                                key={employee.id}
                                onClick={() => handleSourceSelect('employee', employee.id)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                data-testid={`select-source-${employee.id}`}
                              >
                                <Avatar>
                                  <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{employee.name}</div>
                                  <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Select Assets */}
              {currentStep === 1 && (
                <Card className="dark:border-border" data-testid="step-assets">
                  <CardHeader>
                    <CardTitle>Select Assets to Transfer</CardTitle>
                    <CardDescription>
                      {availableAssets.length} assets available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAssets ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : availableAssets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No assets available</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availableAssets.map(asset => (
                          <div
                            key={asset.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              selectedAssets.includes(asset.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-accent"
                            )}
                            onClick={() => handleAssetToggle(asset.id)}
                            data-testid={`asset-checkbox-${asset.id}`}
                          >
                            <Checkbox
                              checked={selectedAssets.includes(asset.id)}
                              onCheckedChange={() => handleAssetToggle(asset.id)}
                              onClick={e => e.stopPropagation()}
                            />
                            {asset.imageUrl && (
                              <img src={asset.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                            <div>
                              <div className="font-medium">{getModelNumber(asset) || asset.assetType?.name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{asset.assetType?.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={() => setCurrentStep(0)}>Back</Button>
                      <Button onClick={() => setCurrentStep(2)} disabled={selectedAssets.length === 0}>
                        Continue <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Select Destination */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="step-destination">
                  <Card
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:-translate-y-1 dark:border-border",
                      sourceType === 'inventory' && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => handleDestinationSelect('inventory')}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-chart-2/10 flex items-center justify-center">
                        <Boxes className="w-7 h-7 text-chart-2" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg">To Inventory</h3>
                        <p className="text-muted-foreground">Return assets to inventory</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer transition-all duration-200 hover:-translate-y-1 dark:border-border"
                    onClick={() => setDestinationType('selectEmployee')}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg">To Employee</h3>
                        <p className="text-muted-foreground">Assign assets to an employee</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>

                  {destinationType === 'selectEmployee' && (
                    <div className="col-span-full mt-4">
                      <Card className="dark:border-border">
                        <CardHeader><CardTitle>Select Destination Employee</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {employees
                              .filter(e => e.id !== sourceEmployee)
                              .map(employee => (
                                <button
                                  key={employee.id}
                                  onClick={() => handleDestinationSelect('employee', employee.id)}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                  data-testid={`select-dest-${employee.id}`}
                                >
                                  <Avatar>
                                    <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{employee.name}</div>
                                    <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="col-span-full">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirm */}
              {currentStep === 3 && (
                <Card className="dark:border-border" data-testid="step-confirm">
                  <CardHeader>
                    <CardTitle>Confirm Transfer</CardTitle>
                    <CardDescription>Review and confirm the transfer details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-center gap-4 p-6 rounded-xl bg-muted/50">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">{sourceType}</Badge>
                        <p className="font-medium">
                          {sourceType === 'inventory' ? 'Inventory' : employees.find(e => e.id === sourceEmployee)?.name}
                        </p>
                      </div>
                      <ArrowRight className="w-8 h-8 text-primary" />
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">{destinationType}</Badge>
                        <p className="font-medium">
                          {destinationType === 'inventory' ? 'Inventory' : employees.find(e => e.id === destinationEmployee)?.name}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Assets ({selectedAssets.length})</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableAssets
                          .filter(a => selectedAssets.includes(a.id))
                          .map(asset => (
                            <div key={asset.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{getModelNumber(asset) || asset.assetType?.name || 'N/A'}</span>
                              <span className="text-muted-foreground">-</span>
                              <span className="text-sm text-muted-foreground">{asset.assetType?.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="mb-2 block">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this transfer..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        data-testid="transfer-notes"
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                      <Button onClick={handleSubmit} disabled={submitting} data-testid="confirm-transfer-btn">
                        {submitting ? <>Processing...</> : <><Check className="w-4 h-4 mr-2" />Confirm Transfer</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {showManualDialog && (
        <ManualTransferDialog
          open={showManualDialog}
          onClose={() => setShowManualDialog(false)}
          onSuccess={() => { setShowManualDialog(false); fetchData(); }}
        />
      )}

      {/* Note Popup */}
      {notePopup && <NotePopup note={notePopup} onClose={() => setNotePopup(null)} />}

      {/* Delete Transfer Dialog */}
      <AlertDialog open={!!deleteTransferId} onOpenChange={(open) => !open && setDeleteTransferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transfer record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransfer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
