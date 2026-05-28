import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Save, AlertTriangle, Shield, Bell, Video as VideoIcon } from "lucide-react";

export function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    email: true,
    roomInvites: true,
    sessionReminders: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Settings saved successfully!");
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="max-w-[900px]">
        <form onSubmit={handleSave} className="space-y-6">
            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8" aria-labelledby="account-settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 id="account-settings-heading" className="text-xl font-bold text-gray-900">
                  Account Settings
                </h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="display-name" className="block mb-2 text-sm font-semibold text-gray-700">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="display-name"
                    name="displayName"
                    defaultValue="John Student"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="settings-email" className="block mb-2 text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="settings-email"
                    name="email"
                    defaultValue="john.student@university.edu"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="settings-university" className="block mb-2 text-sm font-semibold text-gray-700">
                    University
                  </label>
                  <input
                    type="text"
                    id="settings-university"
                    name="university"
                    defaultValue="University of Example"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8" aria-labelledby="notification-settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <h3 id="notification-settings-heading" className="text-xl font-bold text-gray-900">
                  Notification Preferences
                </h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    name="emailNotifications"
                    checked={notifications.email}
                    onChange={(e) =>
                      setNotifications({ ...notifications, email: e.target.checked })
                    }
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Email Notifications</span>
                    <span className="text-sm text-gray-600">Receive updates via email</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    id="room-invites"
                    name="roomInvites"
                    checked={notifications.roomInvites}
                    onChange={(e) =>
                      setNotifications({ ...notifications, roomInvites: e.target.checked })
                    }
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Room Invitations</span>
                    <span className="text-sm text-gray-600">Get notified when invited to rooms</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    id="session-reminders"
                    name="sessionReminders"
                    checked={notifications.sessionReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, sessionReminders: e.target.checked })
                    }
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Session Reminders</span>
                    <span className="text-sm text-gray-600">Remind me before scheduled sessions</span>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8" aria-labelledby="audio-video-settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <VideoIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 id="audio-video-settings-heading" className="text-xl font-bold text-gray-900">
                  Audio/Video Settings
                </h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="camera-device" className="block mb-2 text-sm font-semibold text-gray-700">
                    Camera Device
                  </label>
                  <select
                    id="camera-device"
                    name="cameraDevice"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="default">Default Camera</option>
                    <option value="camera1">Built-in Camera</option>
                    <option value="camera2">External Camera</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="microphone-device" className="block mb-2 text-sm font-semibold text-gray-700">
                    Microphone Device
                  </label>
                  <select
                    id="microphone-device"
                    name="microphoneDevice"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="default">Default Microphone</option>
                    <option value="mic1">Built-in Microphone</option>
                    <option value="mic2">External Microphone</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="speaker-device" className="block mb-2 text-sm font-semibold text-gray-700">
                    Speaker Device
                  </label>
                  <select
                    id="speaker-device"
                    name="speakerDevice"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="default">Default Speakers</option>
                    <option value="speaker1">Built-in Speakers</option>
                    <option value="speaker2">External Speakers</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8" aria-labelledby="privacy-settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <h3 id="privacy-settings-heading" className="text-xl font-bold text-gray-900">
                  Privacy Settings
                </h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    id="show-profile"
                    name="showProfile"
                    defaultChecked
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Show my profile to other users</span>
                    <span className="text-sm text-gray-600">Make your profile visible in the community</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    id="show-stats"
                    name="showStats"
                    defaultChecked
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block">Show my study statistics</span>
                    <span className="text-sm text-gray-600">Display your session stats on your profile</span>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8" aria-labelledby="password-settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <h3 id="password-settings-heading" className="text-xl font-bold text-gray-900">
                  Change Password
                </h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label htmlFor="current-password" className="block mb-2 text-sm font-semibold text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    name="currentPassword"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block mb-2 text-sm font-semibold text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    name="newPassword"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-new-password" className="block mb-2 text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm-new-password"
                    name="confirmNewPassword"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto bg-white border border-gray-300 px-8 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-8 bg-red-50 rounded-2xl border-2 border-red-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                      navigate("/");
                    }
                  }}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition shadow-md hover:shadow-lg"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
