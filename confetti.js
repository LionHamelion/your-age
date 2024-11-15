// Copyright (c) 2024 by coDribble (https://codepen.io/codribble/pen/gOQmqJb)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var retina = window.devicePixelRatio,

    PI = Math.PI,
    sqrt = Math.sqrt,
    round = Math.round,
    random = Math.random,
    cos = Math.cos,
    sin = Math.sin,

    rAF = window.requestAnimationFrame,
    cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame,
    _now = Date.now || function () { return new Date().getTime(); };

(function (w) {
  var prev = _now();
  function fallback(fn) {
    var curr = _now();
    var ms = Math.max(0, 16 - (curr - prev));
    var req = setTimeout(fn, ms);
    prev = curr;
    return req;
  }

  var cancel = w.cancelAnimationFrame
    || w.webkitCancelAnimationFrame
    || w.clearTimeout;

  rAF = w.requestAnimationFrame
    || w.webkitRequestAnimationFrame
    || fallback;

  cAF = function (id) {
    cancel.call(w, id);
  };
}(window));

var confettiInstance;

document.addEventListener("DOMContentLoaded", function () {
  var speed = 60,
      duration = (1.0 / speed),
      confettiRibbonCount = 11,
      ribbonPaperCount = 30,
      ribbonPaperDist = 8.0,
      ribbonPaperThick = 8.0,
      confettiPaperCount = 120,
      DEG_TO_RAD = PI / 180,
      RAD_TO_DEG = 180 / PI,
      colors = [
        ["#df0049", "#660671"],
        ["#00e857", "#005291"],
        ["#2bebbc", "#05798a"],
        ["#ffd200", "#b06c00"]
      ];

  // Клас Vector2
  function Vector2(_x, _y) {
    this.x = _x;
    this.y = _y;
  }
  Vector2.prototype = {
    Length: function () {
      return sqrt(this.SqrLength());
    },
    SqrLength: function () {
      return this.x * this.x + this.y * this.y;
    },
    Add: function (_vec) {
      this.x += _vec.x;
      this.y += _vec.y;
    },
    Sub: function (_vec) {
      this.x -= _vec.x;
      this.y -= _vec.y;
    },
    Div: function (_f) {
      this.x /= _f;
      this.y /= _f;
    },
    Mul: function (_f) {
      this.x *= _f;
      this.y *= _f;
    },
    Normalize: function () {
      var sqrLen = this.SqrLength();
      if (sqrLen != 0) {
        var factor = 1.0 / sqrt(sqrLen);
        this.x *= factor;
        this.y *= factor;
      }
    },
    Normalized: function () {
      var sqrLen = this.SqrLength();
      if (sqrLen != 0) {
        var factor = 1.0 / sqrt(sqrLen);
        return new Vector2(this.x * factor, this.y * factor);
      }
      return new Vector2(0, 0);
    }
  };
  Vector2.Lerp = function (_vec0, _vec1, _t) {
    return new Vector2((_vec1.x - _vec0.x) * _t + _vec0.x, (_vec1.y - _vec0.y) * _t + _vec0.y);
  };
  Vector2.Distance = function (_vec0, _vec1) {
    return sqrt(Vector2.SqrDistance(_vec0, _vec1));
  };
  Vector2.SqrDistance = function (_vec0, _vec1) {
    var x = _vec0.x - _vec1.x;
    var y = _vec0.y - _vec1.y;
    return (x * x + y * y);
  };
  Vector2.Scale = function (_vec0, _vec1) {
    return new Vector2(_vec0.x * _vec1.x, _vec0.y * _vec1.y);
  };
  Vector2.Min = function (_vec0, _vec1) {
    return new Vector2(Math.min(_vec0.x, _vec1.x), Math.min(_vec0.y, _vec1.y));
  };
  Vector2.Max = function (_vec0, _vec1) {
    return new Vector2(Math.max(_vec0.x, _vec1.x), Math.max(_vec0.y, _vec1.y));
  };
  Vector2.ClampMagnitude = function (_vec0, _len) {
    var vecNorm = _vec0.Normalized();
    return new Vector2(vecNorm.x * _len, vecNorm.y * _len);
  };
  Vector2.Sub = function (_vec0, _vec1) {
    return new Vector2(_vec0.x - _vec1.x, _vec0.y - _vec1.y);
  };

  // Клас EulerMass
  function EulerMass(_x, _y, _mass, _drag) {
    this.position = new Vector2(_x, _y);
    this.mass = _mass;
    this.drag = _drag;
    this.force = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);
  }
  EulerMass.prototype = {
    AddForce: function (_f) {
      this.force.Add(_f);
    },
    Integrate: function (_dt) {
      var acc = this.CurrentForce(this.position);
      acc.Div(this.mass);
      var posDelta = new Vector2(this.velocity.x, this.velocity.y);
      posDelta.Mul(_dt);
      this.position.Add(posDelta);
      acc.Mul(_dt);
      this.velocity.Add(acc);
      this.force = new Vector2(0, 0);
    },
    CurrentForce: function (_pos, _vel) {
      var totalForce = new Vector2(this.force.x, this.force.y);
      var speed = this.velocity.Length();
      var dragVel = new Vector2(this.velocity.x, this.velocity.y);
      dragVel.Mul(this.drag * this.mass * speed);
      totalForce.Sub(dragVel);
      return totalForce;
    }
  };

  function ConfettiPaper(_x, _y) {
    this.pos = new Vector2(_x, _y);
    this.rotationSpeed = (random() * 600 + 800);
    this.angle = DEG_TO_RAD * random() * 360;
    this.rotation = DEG_TO_RAD * random() * 360;
    this.cosA = 1.0;
    this.size = 5.0;
    this.oscillationSpeed = (random() * 1.5 + 0.5);
    this.xSpeed = 40.0;
    this.ySpeed = (random() * 60 + 50.0);
    this.corners = [];
    this.time = random();
    var ci = round(random() * (colors.length - 1));
    this.frontColor = colors[ci][0];
    this.backColor = colors[ci][1];
    for (var i = 0; i < 4; i++) {
      var dx = cos(this.angle + DEG_TO_RAD * (i * 90 + 45));
      var dy = sin(this.angle + DEG_TO_RAD * (i * 90 + 45));
      this.corners[i] = new Vector2(dx, dy);
    }
  }
  ConfettiPaper.prototype.Update = function (_dt) {
    this.time += _dt;
    this.rotation += this.rotationSpeed * _dt;
    this.cosA = cos(DEG_TO_RAD * this.rotation);
    this.pos.x += cos(this.time * this.oscillationSpeed) * this.xSpeed * _dt;
    this.pos.y += this.ySpeed * _dt;
  };
  ConfettiPaper.prototype.Draw = function (_g) {
    if (this.cosA > 0) {
      _g.fillStyle = this.frontColor;
    } else {
      _g.fillStyle = this.backColor;
    }
    _g.beginPath();
    _g.moveTo((this.pos.x + this.corners[0].x * this.size) * retina, (this.pos.y + this.corners[0].y * this.size * this.cosA) * retina);
    for (var i = 1; i < 4; i++) {
      _g.lineTo((this.pos.x + this.corners[i].x * this.size) * retina, (this.pos.y + this.corners[i].y * this.size * this.cosA) * retina);
    }
    _g.closePath();
    _g.fill();
  };
  ConfettiPaper.prototype.isFinished = function () {
    return this.pos.y > ConfettiPaper.bounds.y;
  };
  ConfettiPaper.bounds = new Vector2(0, 0);

  // Клас ConfettiRibbon
  function ConfettiRibbon(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag) {
    this.particleDist = _dist;
    this.particleCount = _count;
    this.particleMass = _mass;
    this.particleDrag = _drag;
    this.particles = [];
    var ci = round(random() * (colors.length - 1));
    this.frontColor = colors[ci][0];
    this.backColor = colors[ci][1];
    this.xOff = (cos(DEG_TO_RAD * _angle) * _thickness);
    this.yOff = (sin(DEG_TO_RAD * _angle) * _thickness);
    this.position = new Vector2(_x, _y);
    this.prevPosition = new Vector2(_x, _y);
    this.velocityInherit = (random() * 2 + 4);
    this.time = random() * 100;
    this.oscillationSpeed = (random() * 2 + 2);
    this.oscillationDistance = (random() * 40 + 40);
    this.ySpeed = (random() * 40 + 80);
    for (var i = 0; i < this.particleCount; i++) {
      this.particles[i] = new EulerMass(_x, _y - i * this.particleDist, this.particleMass, this.particleDrag);
    }
  }
  ConfettiRibbon.prototype.Update = function (_dt) {
    var i = 0;
    this.time += _dt * this.oscillationSpeed;
    this.position.y += this.ySpeed * _dt;
    this.position.x += cos(this.time) * this.oscillationDistance * _dt;
    this.particles[0].position = this.position;
    var deltaX = this.prevPosition.x - this.position.x;
    var deltaY = this.prevPosition.y - this.position.y;
    var delta = sqrt(deltaX * deltaX + deltaY * deltaY);
    this.prevPosition = new Vector2(this.position.x, this.position.y);
    for (i = 1; i < this.particleCount; i++) {
      var dirP = Vector2.Sub(this.particles[i - 1].position, this.particles[i].position);
      dirP.Normalize();
      dirP.Mul((delta / _dt) * this.velocityInherit);
      this.particles[i].AddForce(dirP);
    }
    for (i = 1; i < this.particleCount; i++) {
      this.particles[i].Integrate(_dt);
    }
    for (i = 1; i < this.particleCount; i++) {
      var rp2 = new Vector2(this.particles[i].position.x, this.particles[i].position.y);
      rp2.Sub(this.particles[i - 1].position);
      rp2.Normalize();
      rp2.Mul(this.particleDist);
      rp2.Add(this.particles[i - 1].position);
      this.particles[i].position = rp2;
    }
  };
  ConfettiRibbon.prototype.Draw = function (_g) {
    for (var i = 0; i < this.particleCount - 1; i++) {
      var p0 = new Vector2(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff);
      var p1 = new Vector2(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff);
      if (this.Side(this.particles[i].position.x, this.particles[i].position.y, this.particles[i + 1].position.x, this.particles[i + 1].position.y, p1.x, p1.y) < 0) {
        _g.fillStyle = this.frontColor;
        _g.strokeStyle = this.frontColor;
      } else {
        _g.fillStyle = this.backColor;
        _g.strokeStyle = this.backColor;
      }
      if (i == 0) {
        _g.beginPath();
        _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
        _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
        _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
        _g.closePath();
        _g.stroke();
        _g.fill();
        _g.beginPath();
        _g.moveTo(p1.x * retina, p1.y * retina);
        _g.lineTo(p0.x * retina, p0.y * retina);
        _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
        _g.closePath();
        _g.stroke();
        _g.fill();
      } else if (i == this.particleCount - 2) {
        _g.beginPath();
        _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
        _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
        _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
        _g.closePath();
        _g.stroke();
        _g.fill();
        _g.beginPath();
        _g.moveTo(p1.x * retina, p1.y * retina);
        _g.lineTo(p0.x * retina, p0.y * retina);
        _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
        _g.closePath();
        _g.stroke();
        _g.fill();
      } else {
        _g.beginPath();
        _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
        _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
        _g.lineTo(p1.x * retina, p1.y * retina);
        _g.lineTo(p0.x * retina, p0.y * retina);
        _g.closePath();
        _g.stroke();
        _g.fill();
      }
    }
  };
  ConfettiRibbon.prototype.Side = function (x1, y1, x2, y2, x3, y3) {
    return ((x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2));
  };
  ConfettiRibbon.prototype.isFinished = function () {
    return this.position.y - (this.particleDist * this.particleCount) > ConfettiRibbon.bounds.y;
  };
  ConfettiRibbon.bounds = new Vector2(0, 0);

  confetti = {};
  confetti.Context = function (id) {
    var i = 0;
    this.canvas = document.getElementById(id);
    var canvasParent = this.canvas.parentNode;
    var canvasWidth = canvasParent.offsetWidth;
    var canvasHeight = canvasParent.offsetHeight;
    this.canvas.width = canvasWidth * retina;
    this.canvas.height = canvasHeight * retina;
    this.ctx = this.canvas.getContext('2d');
    var interval = null;
    var confettiRibbons = [];
    ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
    var confettiPapers = [];
    ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);

    // Ініціалізуємо частинки та стрічки
    this.init = function () {
      confettiRibbons = [];
      for (i = 0; i < confettiRibbonCount; i++) {
        confettiRibbons[i] = new ConfettiRibbon(random() * canvasWidth, -random() * canvasHeight * 3, ribbonPaperCount, ribbonPaperDist, ribbonPaperThick, 45, 1, 0.05);
      }
      confettiPapers = [];
      for (i = 0; i < confettiPaperCount; i++) {
        confettiPapers[i] = new ConfettiPaper(random() * canvasWidth, -random() * canvasHeight * 2);
      }
    };

    this.resize = function () {
      canvasWidth = canvasParent.offsetWidth;
      canvasHeight = canvasParent.offsetHeight;
      this.canvas.width = canvasWidth * retina;
      this.canvas.height = canvasHeight * retina;
      ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
      ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
    };
    this.start = function () {
      this.stop();
      this.update();
    };
    this.stop = function () {
      cAF(this.interval);
    };
    this.update = function () {
      var i = 0;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      var allFinished = true;

      for (i = 0; i < confettiPaperCount; i++) {
        confettiPapers[i].Update(duration);
        confettiPapers[i].Draw(this.ctx);
        if (!confettiPapers[i].isFinished()) {
          allFinished = false;
        }
      }

      for (i = 0; i < confettiRibbonCount; i++) {
        confettiRibbons[i].Update(duration);
        confettiRibbons[i].Draw(this.ctx);
        if (!confettiRibbons[i].isFinished()) {
          allFinished = false;
        }
      }

      if (allFinished) {
        this.stop();
        this.canvas.style.display = 'none';
      } else {
        var confettiContext = this;
        this.interval = rAF(function () {
          confettiContext.update();
        });
      }
    };
  };


  confettiInstance = new confetti.Context('confetti');

  window.addEventListener('resize', function (event) {
    confettiInstance.resize();
  });
});

function celebrate() {
  var canvas = document.getElementById('confetti');
  canvas.style.display = 'block';

  confettiInstance.init();

  confettiInstance.start();
}
