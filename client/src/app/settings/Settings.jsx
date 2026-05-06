'use client';
import { useTheme } from '@/context';
import { useSettings } from './useSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import './settings.css';

const INTERFACE_PREFS = [
  {
    key: 'floating_windows_enabled',
    label: 'Floating Windows',
    description: 'Open project panels as draggable, resizable windows instead of full-screen modals. Desktop only — automatically disabled on mobile.',
  },
];

const NOTIFICATION_PREFS = [
  { key: 'task_assigned', label: 'Task assigned or unassigned to you' },
  { key: 'task_updated', label: 'Task you are assigned to is updated' },
  { key: 'task_completed', label: 'Task marked as completed' },
  { key: 'task_deleted', label: 'Task you are assigned to is deleted' },
  { key: 'comment_added', label: 'New comment on your task' },
  { key: 'project_changes', label: 'Project renamed, members added or removed' },
  { key: 'deadline_reminders', label: 'Deadline approaching or overdue reminders' },
  { key: 'announcements', label: 'New project announcements' },
  { key: 'account_actions', label: 'Account actions' },
];

function ToggleRow({ id, label, description, checked, onChange }) {
  return (
    <li className="settings-pref-item">
      <label className="settings-toggle-label" htmlFor={id}>
        <div className="settings-toggle-text">
          <span className="settings-toggle-label-main">{label}</span>
          {description && (
            <span className="settings-description settings-toggle-desc">{description}</span>
          )}
        </div>
        <div className="settings-toggle-wrapper">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            className="settings-toggle-input"
          />
          <span className="settings-toggle-track">
            <span className="settings-toggle-thumb" />
          </span>
        </div>
      </label>
    </li>
  );
}

export default function Settings() {
  const { currentTheme, changeTheme, groupedThemes } = useTheme();
  const { prefs, loading, isSaving, updatePref, savePrefs } = useSettings();
  const { isSubscribed, subscribe, unsubscribe, permission } = usePushNotifications();

  return (
    <div className="page-content">

      <div className="settings-section">
        <h2 className="settings-section-title">
          <i className="fas fa-palette" /> Appearance
        </h2>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-label">Theme</span>
            <span className="settings-description">Choose your preferred color scheme</span>
          </div>
          <select
            value={currentTheme}
            onChange={(e) => changeTheme(e.target.value)}
            className="theme-selector-dropdown"
          >
            {Object.entries(groupedThemes).map(([group, themes]) => (
              <optgroup key={group} label={group}>
                {themes.map((theme) => (
                  <option value={theme.id} key={theme.id}>{theme.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {typeof window !== 'undefined' && window.innerWidth > 900 && (
        <div className="settings-section">
          <h2 className="settings-section-title">
            <i className="fas fa-layer-group" /> Interface
          </h2>
          <p className="settings-section-description">
            Customise how the app looks and behaves.
          </p>

          {loading ? (
            <p className="settings-loading">Loading preferences…</p>
          ) : (
            <>
              <ul className="settings-prefs-list">
                {INTERFACE_PREFS.map(({ key, label, description }) => (
                  <ToggleRow
                    key={key}
                    id={`iface-${key}`}
                    label={label}
                    description={description}
                    checked={prefs[key] ?? false}
                    onChange={(e) => updatePref(key, e.target.checked)}
                  />
                ))}
              </ul>
              <div className="settings-save-row">
                <button className="btn btn-primary" onClick={savePrefs} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="settings-section">
        <h2 className="settings-section-title">
          <i className="fas fa-bell" /> Push Notifications
        </h2>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-label">Browser push notifications</span>
            <span className="settings-description">
              {permission === 'denied'
                ? 'Blocked in browser settings — update your browser permissions to enable'
                : 'Receive notifications even when the app is not open'}
            </span>
          </div>
          <button
            className={`btn ${isSubscribed ? 'btn-danger' : 'btn-primary'} btn-sm`}
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={permission === 'denied'}
          >
            {isSubscribed ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">
          <i className="fas fa-sliders-h" /> Notification Preferences
        </h2>
        <p className="settings-section-description">
          Choose which events send you notifications. Applies to both in-app and push notifications.
        </p>

        {loading ? (
          <p className="settings-loading">Loading preferences…</p>
        ) : (
          <>
            <ul className="settings-prefs-list">
              {NOTIFICATION_PREFS.map(({ key, label }) => (
                <ToggleRow
                  key={key}
                  id={`notif-${key}`}
                  label={label}
                  checked={prefs[key] ?? true}
                  onChange={(e) => updatePref(key, e.target.checked)}
                />
              ))}
            </ul>
            <div className="settings-save-row">
              <button className="btn btn-primary" onClick={savePrefs} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}