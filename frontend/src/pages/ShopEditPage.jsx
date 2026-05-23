/**
 * Page for editing shop details (shop owners only).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, Upload, X } from 'lucide-react';
import FormInput from '../components/FormInput';
import { shopsAPI } from '../api/client';
import { showSuccess, showError } from '../components/Toast';

const ShopEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const logoInputRef = useRef();
  const coverInputRef = useRef();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    sub_city: '',
    woreda: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
  });
  const [openingHours, setOpeningHours] = useState({
    monday: '', tuesday: '', wednesday: '', thursday: '',
    friday: '', saturday: '', sunday: '',
  });
  const [errors, setErrors] = useState({});

  const fetchShop = useCallback(async () => {
    try {
      const response = await shopsAPI.get(id);
      setFormData(response.data);
      if (response.data.logo) setLogoPreview(response.data.logo);
      if (response.data.cover_image) setCoverPreview(response.data.cover_image);
      if (response.data.opening_hours && typeof response.data.opening_hours === 'object') {
        setOpeningHours(prev => ({ ...prev, ...response.data.opening_hours }));
      }
    } catch (error) {
      showError('Failed to load shop details');
      navigate('/shop-dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchShop();
  }, [id, fetchShop]);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'logo') { setLogoFile(file); setLogoPreview(preview); }
    else { setCoverFile(file); setCoverPreview(preview); }
  };

  const clearImage = (type) => {
    if (type === 'logo') { setLogoFile(null); setLogoPreview(null); }
    else { setCoverFile(null); setCoverPreview(null); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Shop name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null && v !== undefined) payload.append(k, v);
      });
      // Serialize opening hours as JSON string
      const cleanHours = Object.fromEntries(
        Object.entries(openingHours).filter(([, v]) => v.trim())
      );
      payload.append('opening_hours', JSON.stringify(cleanHours));
      if (logoFile) payload.append('logo', logoFile);
      if (coverFile) payload.append('cover_image', coverFile);
      await shopsAPI.update(id, payload);
      showSuccess('Shop updated successfully!');
      navigate('/shop-dashboard');
    } catch (error) {
      showError(error?.response?.data?.detail || 'Failed to update shop');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Edit Shop
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update your shop information
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shop Name */}
            <FormInput
              label="Shop Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="e.g., Merkato Electronics Hub"
            />

            {/* Email */}
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="shop@example.com"
            />

            {/* Phone */}
            <FormInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
              placeholder="+251911234567"
            />

            {/* City */}
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Addis Ababa"
            />

            {/* Sub City */}
            <FormInput
              label="Sub City"
              name="sub_city"
              value={formData.sub_city}
              onChange={handleChange}
              placeholder="Addis Ketema"
            />

            {/* Woreda */}
            <FormInput
              label="Woreda"
              name="woreda"
              value={formData.woreda}
              onChange={handleChange}
              placeholder="08"
            />

            {/* Latitude */}
            <FormInput
              label="Latitude"
              name="latitude"
              type="number"
              step="0.0001"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="9.0192"
            />

            {/* Longitude */}
            <FormInput
              label="Longitude"
              name="longitude"
              type="number"
              step="0.0001"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="38.7525"
            />
          </div>

          {/* Image Uploads */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shop Logo</label>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} />
              {logoPreview ? (
                <div className="relative w-24 h-24">
                  <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-xl object-cover border" />
                  <button type="button" onClick={() => clearImage('logo')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => logoInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                  <Upload className="h-4 w-4" /> Upload Logo
                </button>
              )}
            </div>
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Image</label>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'cover')} />
              {coverPreview ? (
                <div className="relative h-24 w-full">
                  <img src={coverPreview} alt="Cover" className="w-full h-24 rounded-xl object-cover border" />
                  <button type="button" onClick={() => clearImage('cover')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => coverInputRef.current.click()} className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                  <Upload className="h-4 w-4" /> Upload Cover Image
                </button>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              placeholder="Full address of your shop..."
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your shop..."
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Opening Hours */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Opening Hours</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-24 text-sm text-gray-600 capitalize">{day}</span>
                  <input
                    type="text"
                    value={openingHours[day]}
                    onChange={e => setOpeningHours(prev => ({ ...prev, [day]: e.target.value }))}
                    placeholder="e.g. 8:00-20:00 or Closed"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default ShopEditPage;
