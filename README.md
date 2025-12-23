# Sigfade

Reduce visual noise from Sorbet's `sig` blocks in Ruby files by fading them or auto-collapsing them.

## Features

- **Opacity Fading**: Sig blocks are displayed with reduced opacity when your cursor is outside them
- **Auto-Collapse**: Optionally auto-fold sig blocks to hide them completely
- **Smart Visibility**: Sig blocks become fully visible when you move your cursor inside them
- **Configurable**: Adjust opacity level and choose between fade, fold, or both modes

## Extension Settings

This extension contributes the following settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sigfade.mode` | `string` | `"fade"` | How to handle sig blocks: `fade`, `fold`, or `both` |
| `sigfade.opacity` | `number` | `0.5` | Opacity for faded sig blocks (0.1 = very faded, 1.0 = fully visible) |
| `sigfade.autoFoldOnOpen` | `boolean` | `false` | Automatically fold all sig blocks when opening a Ruby file |

## Commands

- `Sigfade: Fold All Sig Blocks` - Fold all sig blocks in the active editor
- `Sigfade: Unfold All Sig Blocks` - Unfold all sig blocks in the active editor
- `Sigfade: Toggle Mode (Fade/Fold/Both)` - Cycle through the available modes

## Supported Sig Block Formats

```ruby
# Single-line (brace style)
sig { void }
sig { returns(String) }
sig { params(x: Integer, y: String).returns(Boolean) }

# Multi-line (do...end style)
sig do
  params(
    x: SomeType,
    y: SomeOtherType,
  )
  .returns(MyReturnType)
end
```

## Usage

1. Install the extension
2. Open a Ruby file with Sorbet type signatures
3. Sig blocks will automatically fade when your cursor is outside them
4. Move your cursor into a sig block to see it at full opacity
5. Use `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) and search for "Sigfade" to access commands

## Release Notes

### 0.0.1

Initial release with:
- Opacity fading for sig blocks
- Custom folding provider for sig blocks
- Configurable opacity and modes
- Auto-fold on file open option
