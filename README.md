# 🏛️ Dutch Museums Explorer

A modern, interactive web application for exploring museums across the Netherlands. Features real-time opening hours, comprehensive search, and beautiful responsive design.

![Dutch Museums Explorer](https://img.shields.io/badge/Museums-509-blue) ![Status](https://img.shields.io/badge/Status-Live-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎯 **Core Functionality**

- **509 Dutch Museums** - Comprehensive database of museums across the Netherlands
- **Real-time Status** - Live opening/closing status based on current Netherlands time
- **Smart Search** - Search by name, location, description, facilities, and more
- **Dual View Modes** - Switch between grid and list layouts
- **Advanced Filtering** - Filter by opening status and museum card acceptance
- **Next Opening Times** - Shows when closed museums will reopen next

### 🎨 **Modern Design**

- **Custom Typography** - Metropolis and Young Serif fonts for professional appearance
- **Responsive Design** - Perfect on desktop, tablet, and mobile devices
- **Smooth Animations** - Polished micro-interactions and transitions
- **Accessibility** - Keyboard navigation, focus states, and reduced motion support
- **Dark/Light Themes** - Automatic adaptation to user preferences

### 🔍 **Smart Search System**

- **Comprehensive Search** - Searches through all museum data including descriptions and facilities
- **Auto-suggestions** - Smart suggestions with highlighted matches
- **Keyboard Navigation** - Full keyboard support for power users
- **Real-time Results** - Instant filtering as you type

### 📱 **Interactive Features**

- **Clickable Cards** - Entire museum cards are interactive
- **Detailed Modals** - Rich museum information with images and facilities
- **Time Simulation** - Plan visits for specific dates
- **Status Indicators** - Color-coded opening status with next opening times

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for development)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/LilJiggly/Dutch-Museums.git
   cd Dutch-Museums
   ```

2. **Serve the files**

   ```bash
   # Using Python
   python3 -m http.server 8000

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
Dutch-Museums/
├── 📄 index.html              # Main application page
├── 📄 cards.html              # Grid view card template
├── 📄 list-card.html          # List view card template
├── 🎨 css/
│   ├── fonts.css              # Custom font definitions
│   ├── design-system.css      # Design tokens and variables
│   ├── layout.css             # Main layout and navigation
│   ├── museum-cards.css       # Card component styles
│   ├── list-view-modern.css   # List view styles
│   ├── modal-modern.css       # Modal component styles
│   ├── animations.css         # Animation definitions
│   └── interactive-enhancements.css # Hover effects and interactions
├── 🧠 scripts/
│   ├── config.js              # Application configuration
│   ├── data-loader.js         # Data loading utilities
│   ├── time-utils.js          # Time and date utilities
│   ├── formatters.js          # Data formatting functions
│   ├── search.js              # Search functionality
│   ├── modal.js               # Modal management
│   ├── app.js                 # Main application logic
│   ├── navigation.js          # Navigation and filtering
│   └── main.js                # Application initialization
├── 📊 data/
│   ├── museum_details_full.json # Complete museum database
│   └── museum_details_full.csv  # CSV version of museum data
├── 🖼️ images/                  # Museum images
├── 🔤 fonts/                   # Custom font files
│   ├── metropolis/            # Metropolis font family
│   └── youngserif/            # Young Serif font family
└── 🔧 scraping/               # Data collection tools
    ├── extract_wednesday_for_merge.py
    ├── merge_wednesday_simple.py
    └── run_wednesday_scraping.py
```

## 🛠️ Development

### Data Structure

Each museum entry contains:

```json
{
  "Name": "Museum Name",
  "Address": "Full address",
  "Phone": "Phone number",
  "Google Maps": "Maps URL",
  "Museum Card": "yes/no",
  "Image": "image_filename.jpg",
  "Description_Text": "Detailed description",
  "Facilities": "Comma-separated facilities",
  "Opening_Monday": "10:00 - 17:00",
  "Opening_Tuesday": "10:00 - 17:00",
  "Opening_Wednesday": "10:00 - 17:00",
  "Opening_Thursday": "10:00 - 17:00",
  "Opening_Friday": "10:00 - 17:00",
  "Opening_Saturday": "10:00 - 17:00",
  "Opening_Sunday": "Closed"
}
```

### Adding New Museums

1. Add museum data to `data/museum_details_full.json`
2. Add museum image to `images/` directory
3. Update the data file with the correct image filename

### Customizing Styles

- **Colors**: Edit CSS variables in `css/design-system.css`
- **Typography**: Modify font definitions in `css/fonts.css`
- **Layout**: Adjust grid and spacing in `css/layout.css`
- **Components**: Customize individual components in their respective CSS files

## 🔧 Web Scraping Tools

The project includes Python tools for updating museum data:

### Wednesday Hours Scraping

```bash
# Scrape Wednesday hours for all museums
python3 scraping/extract_wednesday_for_merge.py

# Merge with existing data
python3 scraping/merge_wednesday_simple.py data/museum_details_full.json data/wednesday_hours_merge_TIMESTAMP.csv

# Interactive runner
python3 scraping/run_wednesday_scraping.py
```

### Requirements

- Python 3.7+
- Selenium WebDriver
- BeautifulSoup4
- Chrome/Chromium browser

## 🎨 Design System

### Colors

- **Primary**: Blue (#3B82F6) - Links, buttons, active states
- **Secondary**: Indigo (#6366F1) - Accents and highlights
- **Success**: Green (#10B981) - Open status indicators
- **Warning**: Yellow (#F59E0B) - Unknown status
- **Error**: Red (#EF4444) - Closed status indicators
- **Neutral**: Gray scale for text and backgrounds

### Typography

- **Display Font**: Young Serif - For headings and museum names
- **Body Font**: Metropolis - For body text and UI elements
- **Monospace**: System fonts for code and data

### Spacing

- **Base Unit**: 0.25rem (4px)
- **Scale**: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Test on multiple browsers and devices
- Ensure accessibility compliance
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Museum Data**: Collected from official museum websites
- **Fonts**: Metropolis by Chris Simpson, Young Serif by Noël Leu
- **Icons**: Emoji icons for universal compatibility
- **Netherlands Time**: Accurate timezone handling for opening hours

## 📞 Contact

- **GitHub**: [@LilJiggly](https://github.com/LilJiggly)
- **Project**: [Dutch Museums Explorer](https://github.com/LilJiggly/Dutch-Museums)

---

**Made with ❤️ for museum lovers in the Netherlands**
