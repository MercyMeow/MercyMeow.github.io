# League of Legends Match Analysis

A comprehensive web application for analyzing League of Legends match data with interactive visualizations, detailed statistics, and performance insights.

![League of Legends Match Analysis](https://img.shields.io/badge/League%20of%20Legends-Match%20Analysis-c7a45d?style=for-the-badge&logo=riot-games)

## 🚀 Features

### 🔍 Enhanced Search Interface
- **Smart Input Validation**: Real-time validation with helpful feedback
- **Multiple Input Formats**: Support for match IDs, URLs, and various formats
- **Search History**: Automatic saving and reuse of previous searches
- **Auto-Region Detection**: Automatically detects region from URLs
- **Helpful Examples**: Interactive examples to guide users

### 📊 Interactive Data Visualizations
- **Gold/XP Progression**: Line charts showing team economic growth over time
- **Damage Distribution**: Doughnut charts displaying player damage contributions
- **Performance Comparison**: Radar charts comparing team metrics
- **Timeline Events**: Scatter plots visualizing match events chronologically
- **Ward Placement Analysis**: Heatmaps showing vision control patterns

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **League Theme**: Authentic League of Legends visual design
- **Accessibility**: WCAG compliant with screen reader support
- **Performance**: Optimized loading and smooth animations

### 🛠️ Advanced Features
- **Comprehensive Error Handling**: User-friendly error messages with helpful tips
- **API Caching**: Intelligent caching to minimize API calls
- **Real-time Validation**: Instant feedback on search inputs
- **Cross-browser Support**: Works on all modern browsers

## 🎮 How to Use

### 1. Get a Riot API Key
1. Visit [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Create a new app or use an existing one
4. Copy your API key (starts with `RGAPI-`)

### 2. Enter Match Information
You can search using any of these formats:
- **Match ID**: `EUW1_4358345`
- **Match URL**: Full League of Legends match URLs
- **Region + Match Number**: Select region and enter match number

### 3. Explore Match Data
Navigate through different tabs to analyze:
- **Overview**: Scoreboard, KDA, items, and basic stats
- **Timeline**: Gold/XP progression and match events
- **Builds**: Item and skill progression over time
- **Advanced**: Damage analysis, vision control, and performance metrics

## 🏗️ Technical Architecture

### Frontend Stack
- **Vanilla JavaScript**: ES6+ modules for clean, maintainable code
- **Chart.js**: Interactive data visualizations
- **CSS Grid/Flexbox**: Modern responsive layouts
- **Web APIs**: LocalStorage, Fetch API, History API

### Component Structure
```
js/
├── app.js                 # Main application entry point
├── router.js              # Client-side routing
├── api.js                 # Riot API integration
├── cache.js               # Data caching system
├── utils.js               # Utility functions and helpers
└── components/
    ├── SearchInterface.js     # Enhanced search with validation
    ├── SearchHistory.js       # Search history management
    ├── ErrorHandler.js        # Comprehensive error handling
    ├── ChartManager.js        # Chart creation and management
    ├── MatchHeader.js         # Match information display
    ├── TabContainer.js        # Tabbed interface navigation
    ├── PlayerCard.js          # Individual player statistics
    ├── TeamOverview.js        # Team comparison display
    ├── LoadingSpinner.js      # Loading state animations
    └── tabs/
        ├── OverviewTab.js     # Match overview and scoreboard
        ├── TimelineTab.js     # Timeline events and progression
        ├── BuildsTab.js       # Item and skill builds
        └── AdvancedTab.js     # Advanced statistics and analysis
```

### Styling Architecture
```
css/
├── styles.css         # Base styles and layout
├── theme.css          # League of Legends theme colors
├── components.css     # Component-specific styles
├── responsive.css     # Mobile and tablet optimizations
├── utilities.css      # Utility classes and helpers
├── accessibility.css  # Screen reader and accessibility
└── performance.css    # Performance optimizations
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Riot API key from [developer.riotgames.com](https://developer.riotgames.com/)
- Web server (for local development)

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/MercyMeow/MercyMeow.github.io.git
   cd MercyMeow.github.io
   ```

2. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

4. **Configure API Key**
   - Enter your Riot API key when prompted
   - The key is stored locally in your browser

### GitHub Pages Deployment
The application is automatically deployed to GitHub Pages at:
`https://mercymeow.github.io/`

## 🔧 Configuration

### API Settings
- **Development Keys**: Expire every 24 hours
- **Production Keys**: Contact Riot for long-term keys
- **Rate Limits**: Automatically handled with intelligent caching

### Supported Regions
- **EUW1**: Europe West
- **NA1**: North America
- **KR**: Korea
- **EUN1**: Europe Nordic & East
- **BR1**: Brazil
- **LA1**: Latin America North
- **LA2**: Latin America South
- **OC1**: Oceania
- **RU**: Russia
- **TR1**: Turkey
- **JP1**: Japan

## 🎨 Customization

### Themes
The application uses CSS custom properties for easy theming:
```css
:root {
  --primary-bg: #1a1c4b;
  --secondary-bg: #2a1758;
  --accent-color: #c7a45d;
  --text-primary: #ffffff;
  --border-color: rgba(199, 164, 93, 0.3);
}
```

### Adding New Charts
1. Extend the `ChartManager` class
2. Add new chart methods following existing patterns
3. Update tab components to include new visualizations

## 🐛 Troubleshooting

### Common Issues

**API Key Errors**
- Ensure your API key is valid and not expired
- Development keys expire every 24 hours
- Check that the key starts with `RGAPI-`

**Match Not Found**
- Verify the match ID format (e.g., `EUW1_4358345`)
- Ensure the region is correct
- Check that the match exists and is recent

**Charts Not Loading**
- Ensure JavaScript is enabled
- Check browser console for errors
- Verify Chart.js library is loaded

**CORS Errors**
- Use a local server for development
- Check CORS proxy configuration
- Ensure proper API endpoint URLs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Riot Games** for the League of Legends API
- **Chart.js** for excellent charting capabilities
- **League of Legends Community** for inspiration and feedback

## 📞 Support

For support, questions, or contributions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the Riot API documentation

---

**Disclaimer**: This project is not affiliated with Riot Games. League of Legends is a trademark of Riot Games, Inc.
