'use client';
import { useTheme } from '@/context';
import { useSettings } from './useSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import './settings.css';

const SNAP_PATTERNS = [
  {
    value:       'free',
    label:       'Free',
    icon:        'fa-up-right-and-down-left-from-center',
    description: 'Windows cascade freely — no automatic placement',
  },
  {
    value:       'grid',
    label:       'Grid',
    icon:        'fa-table-cells',
    description: '2 × 2 quadrants — up to 4 windows tile evenly',
  },
  {
    value:       'master',
    label:       'Master + Stack',
    icon:        'fa-table-columns',
    description: 'First window owns the left; others stack on the right',
  },
  {
    value:       'columns',
    label:       'Columns',
    icon:        'fa-grip-lines-vertical',
    description: 'Up to 3 equal vertical columns side by side',
  },
  {
    value:       'rows',
    label:       'Rows',
    icon:        'fa-grip-lines',
    description: 'Up to 3 equal horizontal rows stacked top to bottom',
  },
];

const INTERFACE_PREFS = [
  {
    key:         'floating_windows_enabled',
    label:       'Floating Windows',
    description: 'Open project panels as draggable, resizable windows instead of full-screen modals. Desktop only — automatically disabled on mobile.',
  },
];

const NOTIFICATION_PREFS = [
  { key: 'task_assigned',      label: 'Task assigned or unassigned to you'        },
  { key: 'task_updated',       label: 'Task you are assigned to is updated'       },
  { key: 'task_completed',     label: 'Task marked as completed'                  },
  { key: 'task_deleted',       label: 'Task you are assigned to is deleted'       },
  { key: 'comment_added',      label: 'New comment on your task'                  },
  { key: 'project_changes',    label: 'Project renamed, members added or removed' },
  { key: 'deadline_reminders', label: 'Deadline approaching or overdue reminders' },
  { key: 'announcements',      label: 'New project announcements'                 },
  { key: 'account_actions',    label: 'Account actions'                           },
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

function SnapSubPanel({ prefs, updatePref }) {
  return (
    <div className="settings-sub-panel">
      {/* Snap toggle */}
      <div className="settings-sub-row">
        <label className="settings-toggle-label" htmlFor="snap-windows-toggle" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="settings-toggle-text">
            <span className="settings-toggle-label-main">Auto-snap windows</span>
            <span className="settings-description settings-toggle-desc">
              Place new windows into a tiling layout automatically. Windows remain freely draggable and resizable after placement.
            </span>
          </div>
          <div className="settings-toggle-wrapper">
            <input
              type="checkbox"
              id="snap-windows-toggle"
              checked={prefs.snap_windows_enabled ?? false}
              onChange={(e) => updatePref('snap_windows_enabled', e.target.checked)}
              className="settings-toggle-input"
            />
            <span className="settings-toggle-track">
              <span className="settings-toggle-thumb" />
            </span>
          </div>
        </label>
      </div>

      {prefs.snap_windows_enabled && (
        <div className="settings-snap-patterns">
          <span className="settings-snap-label">
            <i className="fas fa-border-all" /> Layout pattern
          </span>
          <div className="settings-snap-grid">
            {SNAP_PATTERNS.map(({ value, label, icon, description }) => {
              const active = (prefs.snap_pattern ?? 'grid') === value;
              return (
                <button
                  key={value}
                  className={`settings-snap-card ${active ? 'active' : ''}`}
                  onClick={() => updatePref('snap_pattern', value)}
                  title={description}
                  type="button"
                >
                  <i className={`fas ${icon} settings-snap-icon`} />
                  <span className="settings-snap-name">{label}</span>
                  <span className="settings-snap-desc">{description}</span>
                  {active && <i className="fas fa-check settings-snap-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
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

      {window.innerWidth > 900 && (
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
                  <li key={key} className="settings-pref-item">
                    <label className="settings-toggle-label" htmlFor={`iface-${key}`}>
                      <div className="settings-toggle-text">
                        <span className="settings-toggle-label-main">{label}</span>
                        {description && (
                          <span className="settings-description settings-toggle-desc">{description}</span>
                        )}
                      </div>
                      <div className="settings-toggle-wrapper">
                        <input
                          type="checkbox"
                          id={`iface-${key}`}
                          checked={prefs[key] ?? false}
                          onChange={(e) => updatePref(key, e.target.checked)}
                          className="settings-toggle-input"
                        />
                        <span className="settings-toggle-track">
                          <span className="settings-toggle-thumb" />
                        </span>
                      </div>
                    </label>

                    {key === 'floating_windows_enabled' && prefs.floating_windows_enabled && (
                      <SnapSubPanel prefs={prefs} updatePref={updatePref} />
                    )}
                  </li>
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