import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { clothingService } from '../../services/clothingService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ImageWithFallback from '../../components/ImageWithFallback';
import { Plus, Edit2, Trash2, X, Power, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatINR } from '../../utils/formatCurrency';

const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [alertFeedback, setAlertFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    size: 'M',
    color: '',
    rentalPrice: 0,
    securityDeposit: 0,
    quantity: 1,
    image: '',
    images: [],
    newImageUrl: '',
    condition: 'GOOD',
    availabilityStatus: 'AVAILABLE',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invResult, catsResult] = await Promise.all([
        adminService.getAllClothing({ limit: 100 }),
        clothingService.getCategories(),
      ]);
      setItems(invResult.items || []);
      setCategories(catsResult || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [statusConfirmItem, setStatusConfirmItem] = useState(null);

  const handleOpenStatusModal = (item) => {
    setStatusConfirmItem(item);
  };

  const handleCloseStatusModal = () => {
    if (statusConfirmItem && actionLoading[statusConfirmItem.id || statusConfirmItem._id]) return;
    setStatusConfirmItem(null);
  };

  const executeToggleDeactivate = async () => {
    if (!statusConfirmItem) return;
    const item = statusConfirmItem;
    const itemId = item.id || item._id;
    const isCurrentlyAvailable = item.availabilityStatus === 'AVAILABLE';
    const targetStatus = isCurrentlyAvailable ? 'UNAVAILABLE' : 'AVAILABLE';

    setActionLoading((prev) => ({ ...prev, [itemId]: isCurrentlyAvailable ? 'deactivating' : 'activating' }));
    setAlertFeedback(null);

    try {
      try {
        await adminService.updateClothingStatus(itemId, targetStatus);
      } catch (statusErr) {
        // Fallback to updateClothing with clean fields
        const catId = item.category?.id || item.categoryId?.id || item.categoryId?._id || item.categoryId || (categories[0]?.id || '');
        const cleanPayload = {
          name: item.name,
          description: item.description,
          categoryId: typeof catId === 'object' ? (catId.id || catId._id) : catId,
          size: item.size,
          color: item.color,
          rentalPrice: Number(item.rentalPrice),
          securityDeposit: Number(item.securityDeposit),
          quantity: Number(item.quantity),
          image: item.image || '',
          images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []),
          condition: item.condition,
          availabilityStatus: targetStatus,
        };
        await adminService.updateClothing(itemId, cleanPayload);
      }

      // Optimistically update React state immediately
      setItems((prev) =>
        prev.map((i) => ((i.id || i._id) === itemId ? { ...i, availabilityStatus: targetStatus } : i))
      );

      setAlertFeedback({
        type: 'success',
        message: `"${item.name}" has been ${isCurrentlyAvailable ? 'deactivated' : 'activated'} successfully.`
      });
      setStatusConfirmItem(null);
    } catch (err) {
      setAlertFeedback({
        type: 'error',
        message: `Status update failed: ${err.message}`
      });
      setStatusConfirmItem(null);
    } finally {
      setActionLoading((prev) => ({ ...prev, [itemId]: null }));
    }
  };

  const handleOpenDeleteModal = (item) => {
    setDeleteConfirmItem(item);
  };

  const handleCloseDeleteModal = () => {
    if (deleteConfirmItem && actionLoading[deleteConfirmItem.id || deleteConfirmItem._id] === 'deleting') {
      return;
    }
    setDeleteConfirmItem(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    const item = deleteConfirmItem;
    const itemId = item.id || item._id;

    setActionLoading((prev) => ({ ...prev, [itemId]: 'deleting' }));
    setAlertFeedback(null);

    try {
      const res = await adminService.deleteClothing(itemId);

      if (res?.data?.availabilityStatus === 'UNAVAILABLE' || res?.message?.toLowerCase().includes('unavailable')) {
        // Preserved as unavailable due to booking/return history
        setItems((prev) =>
          prev.map((i) => ((i.id || i._id) === itemId ? { ...i, availabilityStatus: 'UNAVAILABLE' } : i))
        );
        setAlertFeedback({
          type: 'info',
          message: `"${item.name}" has rental history, so it was safely deactivated (marked UNAVAILABLE) to preserve records.`
        });
      } else {
        // Permanently deleted
        setItems((prev) => prev.filter((i) => (i.id || i._id) !== itemId));
        setAlertFeedback({
          type: 'success',
          message: `"${item.name}" deleted successfully.`
        });
      }
      setDeleteConfirmItem(null);
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete clothing item.';
      const errorCode = err.code || (err.data?.error?.code);
      setAlertFeedback({
        type: 'error',
        code: errorCode,
        message: errorMsg,
        suggestDeactivateItem: errorCode === 'CLOTHING_HAS_ACTIVE_BOOKINGS' ? item : null
      });
      setDeleteConfirmItem(null);
    } finally {
      setActionLoading((prev) => ({ ...prev, [itemId]: null }));
    }
  };

  const handleOpenModal = (item = null) => {
    setFormError(null);
    if (item) {
      const initialImages = Array.isArray(item.images) && item.images.length > 0
        ? [...item.images]
        : (item.image ? [item.image] : []);

      setEditingItem(item);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        categoryId: item.category?.id || item.categoryId?.id || item.categoryId?._id || item.categoryId || (categories[0]?.id || ''),
        size: item.size || 'M',
        color: item.color || '',
        rentalPrice: item.rentalPrice || 0,
        securityDeposit: item.securityDeposit || 0,
        quantity: item.quantity || 1,
        image: item.image || initialImages[0] || '',
        images: initialImages,
        newImageUrl: '',
        condition: item.condition || 'GOOD',
        availabilityStatus: item.availabilityStatus || 'AVAILABLE',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        size: 'M',
        color: '',
        rentalPrice: 1500,
        securityDeposit: 3000,
        quantity: 1,
        image: '',
        images: [],
        newImageUrl: '',
        condition: 'GOOD',
        availabilityStatus: 'AVAILABLE',
      });
    }
    setIsModalOpen(true);
  };

  const handleAddImageUrl = () => {
    if (!formData.newImageUrl || !formData.newImageUrl.trim()) return;
    const urlToAdd = formData.newImageUrl.trim();
    if (formData.images.includes(urlToAdd)) {
      setFormError('This image URL is already in the photo list.');
      return;
    }
    const updatedImages = [...formData.images, urlToAdd];
    setFormData({
      ...formData,
      images: updatedImages,
      image: formData.image || urlToAdd,
      newImageUrl: ''
    });
    setFormError(null);
  };

  const handleRemoveImageUrl = (indexToRemove) => {
    const updatedImages = formData.images.filter((_, idx) => idx !== indexToRemove);
    setFormData({
      ...formData,
      images: updatedImages,
      image: updatedImages.length > 0 ? updatedImages[0] : ''
    });
  };

  const handleSetPrimaryImage = (url) => {
    const filtered = formData.images.filter((u) => u !== url);
    setFormData({
      ...formData,
      images: [url, ...filtered],
      image: url
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      // Clean and consolidate image list
      let cleanImages = Array.isArray(formData.images)
        ? formData.images.map((u) => u.trim()).filter(Boolean)
        : [];

      // If user typed into single image field or newImageUrl without clicking add, include it
      if (formData.image && formData.image.trim() && !cleanImages.includes(formData.image.trim())) {
        cleanImages.unshift(formData.image.trim());
      }
      if (formData.newImageUrl && formData.newImageUrl.trim() && !cleanImages.includes(formData.newImageUrl.trim())) {
        cleanImages.push(formData.newImageUrl.trim());
      }

      // Deduplicate preserving order
      cleanImages = [...new Set(cleanImages)];

      const primaryImage = cleanImages.length > 0 ? cleanImages[0] : (formData.image ? formData.image.trim() : '');

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        size: formData.size.trim(),
        color: formData.color.trim(),
        rentalPrice: Number(formData.rentalPrice),
        securityDeposit: Number(formData.securityDeposit),
        quantity: Number(formData.quantity),
        image: primaryImage,
        images: cleanImages,
        condition: formData.condition,
        availabilityStatus: formData.availabilityStatus,
      };

      if (!payload.categoryId) {
        throw new Error('Please select a valid category.');
      }

      if (editingItem) {
        await adminService.updateClothing(editingItem.id || editingItem._id, payload);
      } else {
        await adminService.createClothing(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to save clothing item.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && items.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-3xl font-black text-[#231F20] uppercase tracking-wide">
            Inventory Management
          </h1>
          <p className="text-sm text-[#595553] mt-1">Manage rental catalog items, quantities, and status.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="octo-btn px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" /> <span>Add Item</span>
        </button>
      </div>

      {/* Alert Feedback Banner */}
      {alertFeedback && (
        <div
          className={`p-4 rounded-xl flex items-start justify-between border shadow-xs transition-all ${
            alertFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : alertFeedback.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-start space-x-3">
            {alertFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : alertFeedback.type === 'info' ? (
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">{alertFeedback.message}</p>
              {alertFeedback.suggestDeactivateItem && (
                <button
                  onClick={() => {
                    const itemToDeact = alertFeedback.suggestDeactivateItem;
                    setAlertFeedback(null);
                    handleToggleDeactivate(itemToDeact);
                  }}
                  className="mt-2 text-xs font-bold text-rose-900 underline hover:text-rose-700 inline-block"
                >
                  Click here to Deactivate "{alertFeedback.suggestDeactivateItem.name}" instead
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setAlertFeedback(null)}
            className="text-gray-400 hover:text-gray-600 ml-4 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Size/Color</th>
              <th className="px-6 py-4">Price/Deposit</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => {
              const itemId = item.id || item._id;
              const isProcessing = !!actionLoading[itemId];

              return (
                <tr key={itemId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium flex items-center space-x-3">
                    {item.image && (
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-12 object-cover rounded bg-[#EBE4DC]"
                      />
                    )}
                    <span>{item.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.category?.name || '—'}</td>
                  <td className="px-6 py-4">{item.size} / {item.color}</td>
                  <td className="px-6 py-4">
                    <div>{formatINR(item.rentalPrice)} / day</div>
                    <div className="text-xs text-gray-400">Dep: {formatINR(item.securityDeposit)}</div>
                  </td>
                  <td className="px-6 py-4">
                    {item.availableQuantity !== undefined ? `${item.availableQuantity} / ${item.quantity}` : item.quantity}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        item.availabilityStatus === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {item.availabilityStatus || 'AVAILABLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                    <button 
                      onClick={() => handleOpenModal(item)} 
                      disabled={isProcessing}
                      title="Edit Item Details & Increase Stock"
                      className="text-blue-600 hover:text-blue-800 p-1 inline-flex items-center disabled:opacity-40"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      <span className="text-[10px] font-bold">EDIT</span>
                    </button>
                    <button
                      onClick={() => handleOpenStatusModal(item)}
                      disabled={isProcessing}
                      title={item.availabilityStatus === 'AVAILABLE' ? 'Deactivate (Safe Preservation)' : 'Activate Outfit'}
                      className={`p-1 font-bold text-xs inline-flex items-center rounded px-2 py-0.5 border transition-all ${
                        item.availabilityStatus === 'AVAILABLE' 
                          ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' 
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      } disabled:opacity-50`}
                    >
                      {actionLoading[itemId] === 'deactivating' || actionLoading[itemId] === 'activating' ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span className="text-[10px] uppercase font-bold">
                        {actionLoading[itemId] === 'deactivating'
                          ? 'DEACTIVATING...'
                          : actionLoading[itemId] === 'activating'
                          ? 'ACTIVATING...'
                          : item.availabilityStatus === 'AVAILABLE'
                          ? 'DEACTIVATE'
                          : 'ACTIVATE'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(item)}
                      disabled={isProcessing}
                      title="Delete Item"
                      className="text-rose-600 hover:text-rose-800 p-1 inline-flex items-center rounded hover:bg-rose-50 border border-transparent hover:border-rose-200 disabled:opacity-40 transition-colors"
                    >
                      {actionLoading[itemId] === 'deleting' ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span className="text-[10px] font-bold">
                        {actionLoading[itemId] === 'deleting' ? 'DELETING...' : 'DELETE'}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No items found in inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status Confirmation Modal (Activate / Deactivate) */}
      {statusConfirmItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-200">
            <div className={`flex items-center space-x-3 mb-3 ${statusConfirmItem.availabilityStatus === 'AVAILABLE' ? 'text-amber-600' : 'text-emerald-600'}`}>
              <div className={`p-2 rounded-full ${statusConfirmItem.availabilityStatus === 'AVAILABLE' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                <Power className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-heading font-black text-[#231F20] uppercase">
                {statusConfirmItem.availabilityStatus === 'AVAILABLE' ? 'Confirm Deactivation' : 'Confirm Activation'}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to {statusConfirmItem.availabilityStatus === 'AVAILABLE' ? 'deactivate' : 'activate'}{' '}
              <span className="font-bold text-[#231F20]">"{statusConfirmItem.name}"</span>?
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-xs text-gray-600 space-y-1.5">
              {statusConfirmItem.availabilityStatus === 'AVAILABLE' ? (
                <>
                  <div className="flex items-start space-x-2">
                    <span className="text-amber-600 font-bold">✓</span>
                    <span>Item will be marked <strong>UNAVAILABLE</strong> and hidden from active customer rental catalog.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>All historical customer rental records and returns will remain <strong>completely safe and intact</strong>.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Item will be marked <strong>AVAILABLE</strong> and immediately open for new customer bookings.</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseStatusModal}
                disabled={!!actionLoading[statusConfirmItem.id || statusConfirmItem._id]}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeToggleDeactivate}
                disabled={!!actionLoading[statusConfirmItem.id || statusConfirmItem._id]}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center space-x-1.5 ${
                  statusConfirmItem.availabilityStatus === 'AVAILABLE'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading[statusConfirmItem.id || statusConfirmItem._id] && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {actionLoading[statusConfirmItem.id || statusConfirmItem._id]
                    ? 'Processing...'
                    : statusConfirmItem.availabilityStatus === 'AVAILABLE'
                    ? 'Confirm Deactivate'
                    : 'Confirm Activate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-full">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-heading font-black text-[#231F20] uppercase">
                Confirm Deletion
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-bold text-[#231F20]">"{deleteConfirmItem.name}"</span>?
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Items without rental history will be <strong>permanently removed</strong>.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-amber-600 font-bold">✓</span>
                <span>Items with past completed bookings will be <strong>safely preserved and deactivated</strong> to protect customer records.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-rose-600 font-bold">✕</span>
                <span>Items with active or upcoming reservations <strong>cannot be deleted</strong> until completed or cancelled.</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={actionLoading[deleteConfirmItem.id || deleteConfirmItem._id] === 'deleting'}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading[deleteConfirmItem.id || deleteConfirmItem._id] === 'deleting'}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-700 disabled:opacity-50 flex items-center space-x-1.5"
              >
                {actionLoading[deleteConfirmItem.id || deleteConfirmItem._id] === 'deleting' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>{actionLoading[deleteConfirmItem.id || deleteConfirmItem._id] === 'deleting' ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-black text-[#231F20] uppercase">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <input
                    type="text"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rental Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.rentalPrice}
                    onChange={(e) => setFormData({ ...formData, rentalPrice: Number(e.target.value) })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Security Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity {editingItem && <span className="text-xs text-amber-700 font-normal">(Min: {editingItem.quantity} units)</span>}
                  </label>
                  <input
                    type="number"
                    required
                    min={editingItem ? editingItem.quantity : 1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  />
                  {editingItem && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Stock increases supported. Inventory reduction disabled in Phase 1 to safeguard active reservation contracts.
                    </p>
                  )}
                </div>
                <div className="col-span-2 space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">
                      Product Photos ({formData.images.length})
                    </label>
                    <span className="text-[11px] text-gray-500">
                      First photo is the default primary display
                    </span>
                  </div>

                  {/* Existing Images Thumbnails Strip */}
                  {formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {formData.images.map((imgUrl, idx) => {
                        const isPrimary = (formData.image === imgUrl) || (!formData.image && idx === 0);
                        return (
                          <div
                            key={idx}
                            className={`relative group w-20 h-24 border-2 rounded-lg overflow-hidden bg-white ${
                              isPrimary ? 'border-black ring-1 ring-black' : 'border-gray-200'
                            }`}
                          >
                            <ImageWithFallback
                              src={imgUrl}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {isPrimary && (
                              <span className="absolute top-1 left-1 bg-black text-white text-[9px] font-bold px-1 rounded uppercase">
                                Primary
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(imgUrl)}
                                  className="text-[10px] text-white underline font-semibold hover:text-amber-300"
                                >
                                  Make Main
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImageUrl(idx)}
                                className="text-[10px] text-red-300 underline font-semibold hover:text-red-100"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add New Image URL Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.newImageUrl}
                      onChange={(e) => setFormData({ ...formData, newImageUrl: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      className="flex-1 p-2 text-xs border rounded-lg focus:ring-2 focus:ring-black bg-white"
                      placeholder="Paste image URL (https://... or /assets/...) and click Add Photo"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black whitespace-nowrap"
                    >
                      Add Photo
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Availability Status</label>
                  <select
                    value={formData.availabilityStatus}
                    onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-black"
                ></textarea>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-3 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
