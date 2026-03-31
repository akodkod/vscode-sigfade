# Sigfade

Reduce visual noise from Sorbet's `sig` blocks in Ruby files by fading them.

## Features

- **Opacity Fading**: Sig blocks are displayed with reduced opacity when your cursor is outside them
- **Smart Visibility**: Sig blocks become fully visible when you move your cursor inside them
- **Configurable**: Adjust the opacity level to your preference

## Extension Settings

This extension contributes the following settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sigfade.opacity` | `number` | `0.5` | Opacity for faded sig blocks (0.1 = very faded, 1.0 = fully visible) |

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

## Release Notes

### 0.0.1

Initial release with:
- Opacity fading for sig blocks
- Configurable opacity
