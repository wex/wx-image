import styles from '../css/layout.scss';

import icon_check from '../img/check.svg';
import icon_delete from '../img/delete.svg';
import icon_image from '../img/image.svg';

class WxImage extends HTMLElement {

  constructor() 
  {
    super();

    // Add a shadow DOM
    const shadowDOM = this.attachShadow({ mode: 'open' });

    const template  = document.createElement('template');

    this._mode      = this.attributes.action ? 'post' : 'input';

    template.innerHTML = `
<style>${styles.toString()}</style>
<div class="wx-image">
  <label class="wx-image__upload">
    <span class="wx-image__upload--placeholder">
      <img src="${icon_image.toString()}" alt="">
    </span>
    <input class="wx-image__upload--input" type="file" accept="image/*">
  </label>
  <canvas width="${this.attributes.width ? this.attributes.width.value : 640}" height="${this.attributes.height ? this.attributes.height.value : 640}" class="wx-image__preview"></canvas>
  <button class="wx-image__remove"><img src="${icon_delete.toString()}" alt=""></button>
  ${this.attributes.action ? `<button class="wx-image__save"><img src="${icon_check.toString()}" alt=""></button>` : ''}
  <img class="wx-image__source" src="${this.attributes.src ? this.attributes.src.value : ''}" alt="">
</div>`;

    // Render the template
    shadowDOM.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() 
  {
    this._image   = this.attributes.src ? true : false;

    this._scale   = 1;
    this._x       = 0;
    this._y       = 0;

    this._indrag  = null;
    this._dx      = 0;
    this._dy      = 0;

    this._timer   = false;
    this._root    = this.shadowRoot.querySelector('.wx-image');
    this._canvas  = this.shadowRoot.querySelector('canvas.wx-image__preview');
    this._context = this._canvas.getContext('2d');
    this._source  = this.shadowRoot.querySelector('img.wx-image__source');
    this._input   = this.shadowRoot.querySelector('input.wx-image__upload--input');
    this._save    = this.shadowRoot.querySelector('button.wx-image__save');
    this._remove  = this.shadowRoot.querySelector('button.wx-image__remove');
    this._element = (this._mode === 'input') ? this._createInput() : false;

    // Save binds
    if (this._save) {
      this._save.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!this._image) return;

        this._submit();
      });
    }

    // Remove binds
    this._remove.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!this._image) return;

      this._clearImage();
    });

    // Canvas binds
    this._canvas.addEventListener('mousewheel', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!this._image) return;

      this._zoom( e.deltaY > 0 ? 1 : -1, 0.05 );
    });
    this._canvas.addEventListener('mousemove', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!this._image) return;

      if (e.which === 1) {
        this._drag(e.x, e.y);
      }
    });
    this._canvas.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!this._image) return;

      this._dx = e.x;
      this._dy = e.y;
      this._indrag = true;
    });
    this._canvas.addEventListener('mouseup', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!this._image) return;

      this._dx = null;
      this._dy = null;
      this._indrag = false;
    });

    // Input binds
    this._input.addEventListener('change', e => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.files && e.target.files[0]) {
        this._setImage(e.target.files[0]);
      } else {
        this._clearImage();
      }
    });

    // Source binds
    this._source.onload = (e) => {
      if (!this._image) return;
      this._zoom(0, 0);
      this._render();
    };
  }

  _zoom(direction, amount)
  {
    let ns = this._scale + (direction * amount * this._scale);

    if (amount === 0) {
      ns = 0.01;
    }

    ns = Math.max(
      this._canvas.width / (this._source.width),
      this._canvas.height / (this._source.height),
      ns
    );

    let ex = this._x + this._source.width * ns;
    let ey = this._y + this._source.height * ns;

    if (ex < this._canvas.width) {
      this._x += this._canvas.width - ex;
    }
    if (ey < this._canvas.height) {
      this._y += this._canvas.height - ey;
    }

    this._scale = ns;
    this._render();
  }

  _drag(x, y)
  {
    if (!this._indrag) return;

    let nx = 0, ny = 0, ex = 0, ey = 0;
    let tx = x - this._dx;
    let ty = y - this._dy;

    ex = this._x + (this._source.width * this._scale);
    ey = this._y + (this._source.height * this._scale);

    nx = Math.max(Math.min(0, this._x + tx), this._canvas.width - (this._source.width * this._scale));
    ny = Math.max(Math.min(0, this._y + ty), this._canvas.height - (this._source.height * this._scale));

    this._x = nx;
    this._y = ny;

    this._dx = x;
    this._dy = y;
    
    this._render();
  }

  _render()
  {
    this._clear();

    this._context.drawImage(
      this._source,
      this._x,
      this._y,
      this._source.width * this._scale,
      this._source.height * this._scale
    );

      if (this._timer) window.clearTimeout(this._timer);

      this._timer = window.setTimeout(
        () => {
          this._update();
        }, 
        300
      );
  }

  _convertToBlob(source)
  {
    let img = atob(source.split(',')[1]);
    let buf = [];
    for (let i = 0; i < img.length; i++) {
      buf.push(img.charCodeAt(i));
    }

    return new Uint8Array(buf);
  }

  _submit()
  {
    let formData  = new FormData();
    formData.append(
      this.attributes.name ? this.attributes.name.value : "image",
      new Blob(
        [
          this._convertToBlob(
            this._canvas.toDataURL("image/jpeg")
          )
        ],
        {
          type: "image/jpeg",
        }
      )
    );

    fetch(this.attributes.action.value, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData
    }).then(s => {
      this._image = true;
      this._root.classList.remove('has-image');
    }, e => {

    });
  }

  _update()
  {
    if (this._mode === 'input') {
      if (this._image) {

        this._element.value = this._canvas.toDataURL('image/jpeg');

      } else {

        this._element.value = "";

      }
    }
  }

  _clear()
  {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  _setImage(file)
  {
    let reader  = new FileReader();

    this._x = 0;
    this._y = 0;

    reader.onload = (ev) => {
      this._source.src = ev.target.result;
      this._image = true;
      this._root.classList.add('has-image');
    };

    reader.readAsDataURL(file);
  }

  _clearImage()
  {
    this._source.src = "";
    this._image = false;
    this._root.classList.remove('has-image');
    this._clear();
  }

  _createInput()
  {
    const template  = document.createElement('template');
    template.innerHTML = `<textarea style="display: none;" name="${this.attributes.name ? this.attributes.name.value : "image"}"></textarea>`;

    const input     = template.content.cloneNode(true);
    
    const form      = this.closest("form") || this.parentNode;

    form.appendChild(input);

    return form.childNodes[ form.childNodes.length - 1 ];
  }
}

export default WxImage;
