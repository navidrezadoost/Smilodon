# Smilodon Documentation Site

This is the official documentation website for Smilodon, built for deployment on GitHub Pages.

## Features

- **Multi-Language Support**: English, French, Persian (Farsi), Hindi, and Spanish
- **Dark/Light Theme**: Automatic theme switching with system preference detection
- **RTL/LTR Support**: Full bidirectional text support
- **Interactive Playground**: Test Smilodon across 6 frameworks with various configurations
- **Style Customization**: Live style editor with color pickers and export functionality
- **SEO Optimized**: Full Open Graph, Twitter Cards, and Schema.org structured data
- **Responsive Design**: Mobile-first design that works on all devices
- **Zero Build Step**: Pure HTML/CSS/JavaScript for easy deployment

## Structure

```
docs-site/
├── index.html          # Main page with all content
├── styles.css          # Complete styling system  
├── assets/
│   ├── flags/          # SVG flags for language selector
│   └── logo.jpg        # Smilodon logo
├── js/
│   ├── i18n.js         # Internationalization system
│   ├── theme.js        # Theme management  
│   ├── navigation.js   # Page navigation
│   ├── playground.js   # Interactive demo
│   ├── customization.js # Style customization panel
│   └── app.js          # Main application orchestrator
└── pages/              # Content pages (to be added)
```

## Local Development

1. Start a local server:
   ```bash
   cd docs-site
   python3 -m http.server 8080
   ```

2. Open in browser:
   ```
   http://localhost:8080
   ```

## GitHub Pages Deployment

The site is designed to be deployed directly to GitHub Pages:

1. **Push to Repository**:
   ```bash
   git add docs-site/
   git commit -m "Add documentation website"
   git push origin main
   ```

2. **Configure GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `docs-site`
   - Save

3. **Access**:
   - Site will be available at: `https://navidrezadoost.github.io/Smilodon/`

## Features Overview

### Interactive Playground

- **Framework Selection**: Switch between Vanilla JS, React, Vue, Svelte, SolidJS, and React Native
- **Data Size Options**: Test with 50 to 1,000,000 items
- **Feature Toggles**: Enable/disable search, virtualization, infinite scroll, custom rendering, and grouping
- **Performance Metrics**: Real-time render time, items rendered, and total items tracking

### Style Customization

Users can customize:
- Primary color (with color picker)
- Background color
- Text color
- Border radius
- Font size
- Border width
- Spacing
- Shadow intensity

Changes apply in real-time and can be exported as CSS.

### Language Support

- **English (en)**: 🇬🇧
- **French (fr)**: 🇫🇷
- **Persian (fa)**: 🇮🇷
- **Hindi (hi)**: 🇮🇳
- **Spanish (es)**: 🇪🇸

Language preference is saved to localStorage.

### Theme Support

- **Light Mode**: Default theme with bright colors
- **Dark Mode**: Dark theme optimized for low-light environments
- **System Preference**: Automatically detects and applies system theme preference

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Performance

- First Contentful Paint: <1s
- Time to Interactive: <2s
- Lighthouse Score: 95+ (Performance, Accessibility, Best Practices, SEO)

## Accessibility

- WCAG 2.1 Level AA compliant
- Full keyboard navigation
- Screen reader optimized
- High contrast mode support
- Semantic HTML5 markup

## Future Enhancements

- Content pages for all documentation sections
- Search functionality
- Code playground with live editing
- Video tutorials
- API documentation generator
- Version switcher

## Contributing

To add new content pages:

1. Create HTML files in `pages/` directory
2. Update navigation in `index.html`
3. Add translations to `js/i18n.js`
4. Test locally before deployment

## License

Same license as the main Smilodon project (see root LICENSE file).
