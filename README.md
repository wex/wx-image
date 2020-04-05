# wx-image
WebComponent handling image uploads - supports scaling and cropping

## Demo

See: https://wex.fi/wx/wx-image.html

## Installing

Download latest release and use it.

`<script src="js/wx.image.min.js"></script>`

## Usage

```html
<form method="post" enctype="multipart/form-data">
    
    <p>
        <wx-image name="image" width="320" height="320"></wx-image>
    </p>
    <button type="submit">Test</button>

</form>
<script src="js/wx.image.min.js"></script>
```

## Attributes

- `action` : If given, component will use Fetch API to POST image on saving
  - Otherwise a `textarea` with given name will be populated with Base64 Data URL
- `src` : Default image
- `name` : Name for input.
- `width` : Target width for image
- `height` : Target height for image

## Events


# License

MIT