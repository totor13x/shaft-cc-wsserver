'use strict'

// let CoreRole = use('App/Models/Core/Role')
// let Permission = use('App/Models/Core/Permission')

class HasTagFunctions {
  register (Model) {
    let type = 'html'
    let compile = 'standart'

    Model.prototype.setCompile = function (typ) {
      switch (typ) {
        case 'addensive':
          compile = 'addensive'
          break
        case 'standart':
          compile = 'standart'
          break
        default:
          break
      }
      return this
    }
    Model.prototype.setType = function (typ) {
      switch (typ) {
        case 'gmod':
          type = 'gmod'
          break
        case 'html':
          type = 'html'
          break
        default:
          break
      }
      return this
    }
    Model.prototype.fill_standart = function () {
      if (this.border_color_1 == null)
        this.border_color_1 = {
          r: 255,
          g: 255,
          b: 255
        }
      if (this.border_color_2 == null)
        this.border_color_2 = {
          r: 255,
          g: 255,
          b: 255
        }
    }
    Model.prototype.fill_addensive = function () {
      if (this.border_color_1 == null)
        this.border_color_1 = this.primary_color_1
      if (this.border_color_2 == null)
        this.border_color_2 =
          this.secondary_color_2 != null
            ? this.secondary_color_2
            : this.secondary_color_1 != null
              ? this.secondary_color_1
              : this.primary_color_2 != null
                ? this.primary_color_2
                : this.primary_color_1
    }
    Model.prototype.fill_helper = function () {
      if (this.is_primary_gradient)
        if (this.primary_color_2 == null)
          this.primary_color_2 = {
            r: 255,
            g: 255,
            b: 255
          }

      if (this.is_secondary_gradient) {
        if (this.secondary_color_1 == null)
          this.secondary_color_1 = {
            r: 255,
            g: 255,
            b: 255
          }
        if (this.secondary_color_2 == null)
          this.secondary_color_2 = {
            r: 255,
            g: 255,
            b: 255
          }
      }
    }
    Model.prototype.gmod_char = function (char, color) {
      return [char, color]
    }
    Model.prototype.html_char = function (char, color) {
      return `<span style='color:rgb(${color.r},${color.g},${color.b})'>${char}</span>`
    }
    Model.prototype.char = function (char, color) {
      if (color == null) {
        color = {
          r: 255,
          g: 255,
          b: 255
        }
      } else {
        // console.log(color)
        if (typeof color == 'string')
          color = JSON.parse(color)
      }
      if (color.a == null) {
        color.a = 255
      }
      if (type == 'html') {
        return this.html_char(char, color)
      } else if (type == 'gmod') {
        return this.gmod_char(char, color)
      }
    }
    Model.prototype.generate = function () {
      let comp = []

      // console.log(compile, this.border_color_2, this.id)
      if (compile == 'standart') {
        this.fill_standart()
      } else if (compile == 'addensive') {
        this.fill_addensive()
      }
      // console.log(this.border_color_2, 'br1')
      this.fill_helper()
      // console.log(this.border_color_2, 'br1')
      comp.push(this.char('[', this.border_color_1))
      // comp.push('[', this.border_color_1)

      if (this.is_primary_gradient)
      {
        let leng = this.primary_text.length - 1
        let text = [ ...this.primary_text ]
        text.forEach((sym, ix) => {
          let y = this.primary_color_2
          if (typeof y == 'string')
            y = JSON.parse(y)

          let z = this.primary_color_1
          if (typeof z == 'string')
              z = JSON.parse(z)

          // console.log(y, z)
          let t_r = Math.round(z.r + (((y.r - z.r) / leng)) * ix)
          let t_g = Math.round(z.g + (((y.g - z.g) / leng)) * ix)
          let t_b = Math.round(z.b + (((y.b - z.b) / leng)) * ix)

          comp.push(this.char(sym, {
            r: t_r,
            g: t_g,
            b: t_b,
          }))
        })
      }
      else
      {
        comp.push(this.char(this.primary_text, this.primary_color_1))
      }

      if (this.secondary_text != null)
      {
        if (this.is_secondary_gradient)
        {
          let leng = this.secondary_text.length - 1
          let text = [ ...this.secondary_text ]

          text.forEach((sym, ix) => {
            // let y = this.secondary_color_2
            // let z = this.secondary_color_1

            let y = this.secondary_color_2
            if (typeof y == 'string')
              y = JSON.parse(y)

            let z = this.secondary_color_1
            if (typeof z == 'string')
                z = JSON.parse(z)

            let t_r = Math.round(z.r + (((y.r - z.r) / leng)) * ix)
            let t_g = Math.round(z.g + (((y.g - z.g) / leng)) * ix)
            let t_b = Math.round(z.b + (((y.b - z.b) / leng)) * ix)

            comp.push(this.char(sym, {
              r: t_r,
              g: t_g,
              b: t_b,
            }))
          })
        }
        else
        {
          comp.push(this.char(this.secondary_text, this.secondary_color_1))
        }
      }
      // console.log(this.border_color_2, 'br1')
      comp.push(this.char(']', this.border_color_2))
      return comp
    }
  }
}
module.exports = HasTagFunctions
