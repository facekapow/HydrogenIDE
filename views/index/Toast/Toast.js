'use strict';

function Toast() {
  this._element = document.createElement('div');
  this._element.className = 'toastBox';
  this._textElement = document.createElement('span');
  this._element.appendChild(this._textElement);
  this._text = '&nbsp;&nbsp;';
  this._shown = false;
  this._canceled = false;
  this._duration = Toast.LENGTH_SHORT;
  this._gravity = true; // true for bottom, false for top.
  this._xoff = 0;
  this._yoff = 0;
}

Toast.LENGTH_LONG = 4.0;
Toast.LENGTH_SHORT = 1.5;

Toast.makeText = function(txt, duration, gravity) {
  var createdToast = new Toast();
  createdToast.setText(txt);
  createdToast.setDuration(duration);
  if (gravity !== false && gravity !== true) gravity = true; // if it's not a bool (that includes being null), set it.
  createdToast.setGravity(gravity);
  return createdToast;
}

Toast.prototype.cancel = function() {
  if (this._shown && !this._canceled) {
    this._element.parentNode.removeChild(this._element);
  } else {
    this._canceled = true;
  }
  return this;
}

Toast.prototype.getDuration = function() {
  return this._duration;
}

Toast.prototype.getGravity = function() {
  return this._gravity;
}

Toast.prototype.getView = function() {
  return this._element;
}

Toast.prototype.getXOffset = function() {
  return this._xoff;
}

Toast.prototype.getYOffset = function() {
  return this._yoff;
}

Toast.prototype.setDuration = function(duration) {
  this._duration = duration || Toast.LENGTH_SHORT;
  return this;
}

Toast.prototype.setGravity = function(gravity, xoff, yoff) {
  this._gravity = gravity;
  this._xoff = xoff || 0;
  this._yoff = yoff || 0;
  return this;
}

Toast.prototype.setText = function(text) {
  this._text = '&nbsp;' + text + '&nbsp;';
  this._textElement.innerHTML = '&nbsp;' + text + '&nbsp;';
  return this;
}

Toast.prototype.setView = function(view) {
  this._element = view || this._element;
  return this;
}

Toast.prototype.show = function() {
  if (!this._canceled && !this._shown) {
    document.getElementsByTagName('body')[0].appendChild(this._element);
    if (this._gravity) {
      var bottom = 0 + 5 + this._yoff; // 0 + vertical padding + y-offset
      var left = (window.innerWidth/2)-(this._element.offsetWidth/2) + this._xoff;
      this._element.style.bottom = bottom + 'px';
      this._element.style.left = left + 'px';
    } else {
      var top = 0 + 5 + this._yoff; // 0 + vertical padding + y-offset
      var left = (window.innerWidth/2)-(this._element.offsetWidth/2) + this._xoff;
      this._element.style.top = top + 'px';
      this._element.style.left = left + 'px';
    }
    this._shown = true;
    var self = this;
    setTimeout(function() {
      self._element.style.visibility = 'visible';
      self._element.style.opacity = '1';
      setTimeout(function() {
        if (!self._canceled) {
          self._element.style.visibility = 'none';
          self._element.style.opacity = '0';
          setTimeout(function() {
            self._element.parentNode.removeChild(self._element);
            self._canceled = true;
          }, 300);
        }
      }, self._duration * 1000);
    }, 300);
  }
  return this;
}
