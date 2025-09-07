import React, { useState } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Zap, Hand, User, Key, Eye, EyeOff } from 'lucide-react';
import { AppSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onBack
}) => {
  const { currentUser, updateUserProfile, updateUserPassword } = useAuth();
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAutoAdvanceChange = (autoAdvance: boolean) => {
    onUpdateSettings({ ...settings, autoAdvance });
  };

  const handleUsernameUpdate = async () => {
    if (newUsername === currentUser?.username) {
      setIsProfileEditing(false);
      return;
    }

    if (newUsername.length < 3) {
      setError('Username ən azı 3 simvol olmalıdır');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserProfile({ username: newUsername });
      setSuccess('Username uğurla yeniləndi');
      setIsProfileEditing(false);
    } catch (error: any) {
      setError(error.message || 'Username yenilənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      setError('Parol ən azı 6 simvol olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Parollar uyğun gəlmir');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserPassword(newPassword);
      setSuccess('Parol uğurla yeniləndi');
      setIsPasswordEditing(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setError(error.message || 'Parol yenilənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Tənzimləmələr</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {/* User Profile Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">İstifadəçi Profili</h2>
          
          <div className="space-y-6">
            {/* Username Update */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">İstifadəçi adı</h3>
                {!isProfileEditing && (
                  <button
                    onClick={() => setIsProfileEditing(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Dəyişdir
                  </button>
                )}
              </div>
              
              {isProfileEditing ? (
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Yeni username"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleUsernameUpdate}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Saxlanır...' : 'Saxla'}
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileEditing(false);
                        setNewUsername(currentUser?.username || '');
                        setError('');
                      }}
                      className="text-gray-600 hover:text-gray-800"
                      disabled={loading}
                    >
                      Ləğv et
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-800">{currentUser?.username}</span>
                </div>
              )}
            </div>

            {/* Password Update */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">Parol</h3>
                {!isPasswordEditing && (
                  <button
                    onClick={() => setIsPasswordEditing(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Dəyişdir
                  </button>
                )}
              </div>
              
              {isPasswordEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Parol</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Yeni parol"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parolu təkrarla</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Parolu təkrarla"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handlePasswordUpdate}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Saxlanır...' : 'Saxla'}
                    </button>
                    <button
                      onClick={() => {
                        setIsPasswordEditing(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      className="text-gray-600 hover:text-gray-800"
                      disabled={loading}
                    >
                      Ləğv et
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Key className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-500">••••••••</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quiz Settings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Quiz Ayarları</h2>
          
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-medium text-gray-800 mb-4">Sual Keçid Rejimi</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-4 cursor-pointer group">
                  <input
                    type="radio"
                    name="advanceMode"
                    checked={settings.autoAdvance}
                    onChange={() => handleAutoAdvanceChange(true)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Avtomatik keçid</div>
                      <div className="text-sm text-gray-600">Cavab verdikdən sonra avtomatik növbəti suala keç</div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-4 cursor-pointer group">
                  <input
                    type="radio"
                    name="advanceMode"
                    checked={!settings.autoAdvance}
                    onChange={() => handleAutoAdvanceChange(false)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                      <Hand className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Manual keçid</div>
                      <div className="text-sm text-gray-600">"Növbəti" düyməsinə basaraq özünüz keçid edin</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 text-center">
            Ayarlar avtomatik saxlanılır
          </p>
        </div>
      </div>
    </div>
  );
};