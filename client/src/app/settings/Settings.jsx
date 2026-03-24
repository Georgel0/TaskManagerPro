'use client';
import { useTheme } from '@/context';

export default function Settings() {
  const { currentTheme, changeTheme, groupedThemes } = useTheme();

  return (
    <div className='page-content'>
      <div className="theme-selector-section">
        <h3>Select Theme:</h3>
        <select 
          value={currentTheme} 
          onChange={(e) => changeTheme(e.target.value)} 
          className='theme-select-dropdown'
        >
          {Object.entries(groupedThemes).map(([group, themes]) => (
            <optgroup key={group} label={group}>
              {themes.map(theme => (
                <option value={theme.id} key={theme.id}>
                  {theme.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}