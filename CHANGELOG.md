# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-09

### Added

#### 📱 Progressive Web App (PWA)
- **Full Installability**: App is now fully installable on iOS and Android devices.
- **Manifest**: Added `manifest.webmanifest` with icons and theme colors.
- **Offline Support**: Basic offline capabilities via Service Worker.

#### 🌍 Multi-currency Support
- **Real-time Conversion**: Integration with ExchangeRate-API for live COP/USD conversion.
- **Base Currency Selection**: Users can now select their preferred base currency in settings.
- **Transaction Handling**: Transactions now store original currency and amount, automatically converting to the base currency for display.

#### 🔍 Advanced Filtering
- **Granular Control**: Filter transactions by:
    - **Category**: Specific expense/income categories.
    - **Tags**: New optional tags field for deeper classification.
    - **Date Range**: Custom date range filtering.
- **Server-side Processing**: Optimized filtering logic for performance.

#### 🏷️ Transaction Tags
- **New Field**: Added an optional "Tags" field to the transaction form.
- **Flexible Organization**: Users can add multiple tags to transactions for better grouping (e.g., #travel, #food).

### Changed
- **Dashboard**: Updated dashboard to reflect multi-currency totals.
- **Transaction List**: Enhanced list view to show original currency details.

### Fixed
- **Layout**: Minor layout adjustments for better mobile responsiveness.
