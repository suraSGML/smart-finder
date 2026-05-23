import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, X, Clock, Trash2, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { showError, showSuccess } from './Toast';
import { searchAPI } from '../api/client';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  // Fetch suggestions from API with debouncing
  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await searchAPI.suggestions({ q: searchQuery });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    if (value.length > 0) {
      setShowSuggestions(true);
      // Debounce API calls - wait 300ms before fetching
      suggestionsTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(true);
    }
  };

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    // Add to history
    const newHistory = [searchQuery, ...searchHistory.filter((h) => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setQuery('');
    setShowSuggestions(false);
    onSearch?.(searchQuery);
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showError('Voice search not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'am-ET'; // Amharic
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      showError(`Voice search error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion);
  };

  const handleHistoryClick = (item) => {
    handleSearch(item);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 px-4 py-2">
        <Search className="text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          placeholder={t('home.searchPlaceholder')}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />

        {query && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleVoiceSearch}
          className={`${
            isListening
              ? 'text-red-500 animate-pulse'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title="Voice search"
        >
          <Mic size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSearch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg font-medium transition-colors"
        >
          {t('common.search')}
        </motion.button>
      </div>

      {/* Suggestions & History Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
            onMouseLeave={() => setShowSuggestions(false)}
          >
            {/* Loading State */}
            {isLoadingSuggestions && (
              <div className="px-4 py-6 text-center flex items-center justify-center gap-2">
                <Loader size={16} className="animate-spin text-blue-500" />
                <span className="text-gray-500 dark:text-gray-400">{t('common.loading')}</span>
              </div>
            )}

            {/* Suggestions */}
            {!isLoadingSuggestions && suggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {t('common.search')} Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Search size={16} className="text-gray-400" />
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Search History */}
            {!isLoadingSuggestions && searchHistory.length > 0 && suggestions.length === 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex justify-between items-center">
                  <span>{t('common.search')} History</span>
                  <button
                    onClick={handleClearHistory}
                    className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Clock size={16} className="text-gray-400" />
                    {item}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingSuggestions && suggestions.length === 0 && searchHistory.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                <p>{t('common.noResults')}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
