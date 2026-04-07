'use client';
import React, { createContext, useEffect, useState,  useContext } from 'react';

const THEMES_DATA = [
  { id: 'light-default', label: 'Classic Light', group: 'Light Themes' },
  { id: 'light-mint', label: 'Light Mint', group: 'Light Themes' },
  { id: 'light-pastel', label: 'Soft Lavender', group: 'Light Themes' },
  { id: 'dark-crimson', label: 'Crimson Black', group: 'Dark Themes' },
  { id: 'dark-ocean', label: 'Deep Ocean', group: 'Dark Themes' },
  { id: 'dark-neon', label: 'Cyber Neon', group: 'Dark Themes' },
];

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light-default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('task_manager_theme') || 'light-default';

    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('task_manager_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const groupedThemes = THEMES_DATA.reduce((acc, theme) => {
    if (!acc[theme.group]) acc[theme.group] = [];

    acc[theme.group].push(theme);
    return acc;
  }, {});

  const value ={ currentTheme, changeTheme, themeData: THEMES_DATA, groupedThemes };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
};
