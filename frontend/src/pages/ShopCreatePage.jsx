/**
 * Shop creation page for shop owners.
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, MapPin } from 'lucide-react';
import FormInput from '../components/FormInput';
import { shopsAPI } from '../api/client';
import toast from 'react-hot-toast';

const CITIES = ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Hawassa', 'Bahir Dar', 'Adama', 'Jimma', 'Dessie', 'Other'];

const ShopCreatePage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const logoRef = useRef();
  const coverRef = useRef();
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', description: '', address: '', city: 'Addis Ababa',
    sub_city: '', woreda: '', phone: '', email: '', website: '',
    latitude: '', longitude: '',
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleImage = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'logo') { setLogoFile(file); setLogoPreview(url); }
    else { setCoverFile(file); setCoverPreview(url); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('Location set.');
      },
      () => toast.error('Could not get location.')
    );
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Shop name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) payload.append(k, v); });
      if (logoFile) payload.append('logo', logoFile);
      if (coverFile) payload.append('cover_image', coverFile);
      await shopsAPI.create(payload);
      toast.success('Shop submitted for approval! You will be notified once approved.');
      navigate('/shop-dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      }
      toast.error('Failed to create shop. Check the form for errors.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Register Your Shop</h1>
      <p className="text-sm text-gray-500 mb-6">Your shop will be reviewed by an admin before going live.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
        {/* Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Logo</label>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleImage(e, 'logo')} />
            {logoPreview ? (
              <div className="relative w-24 h-24">
                <img src={logoPreview} alt="Logo" className="w-24 h-24 rounded-xl object-cover border" />
                <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => logoRef.current.click()} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                <Upload className="h-4 w-4" /> Upload Logo
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => handleImage(e, 'cover')} />
            {coverPreview ? (
              <div className="relative h-24 w-full">
                <img src={coverPreview} alt="Cover" className="w-full h-24 rounded-xl object-cover border" />
                <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => coverRef.current.click()} className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                <Upload className="h-4 w-4" /> Upload Cover
              </button>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Shop Name *" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. Merkato Electronics" />
          <FormInput label="Phone *" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+251911234567" />
          <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="shop@example.com" />
          <FormInput label="Website" name="website" value={form.website} onChange={handleChange} placeholder="https://..." />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Full street address..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select name="city" value={form.city} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <FormInput label="Sub City" name="sub_city" value={form.sub_city} onChange={handleChange} placeholder="e.g. Bole" />
          <FormInput label="Woreda" name="woreda" value={form.woreda} onChange={handleChange} placeholder="e.g. 03" />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <MapPin className="h-4 w-4" /> GPS Coordinates (for map)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Latitude" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} placeholder="9.0192" />
            <FormInput label="Longitude" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} placeholder="38.7525" />
          </div>
          <button type="button" onClick={useMyLocation} className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Use my current location
          </button>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Tell customers about your shop..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting...' : 'Submit Shop for Approval'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopCreatePage;
