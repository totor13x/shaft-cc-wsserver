'use strict'

const Tag = use('App/Models/Economy/Tag')

class TagsController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  async onTagsList () {
	  
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-tag'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
	
    let tags = await Tag
      .query()
      .fetch()

    tags.rows.forEach(tag => {
      tag.generated = tag
        .setCompile('addensive')
        .setType('html')
        .generate()
    })

    tags = await tags.toJSON()

    this.socket.emit('tagsList', tags)
  }

  async onTagData(id) {
	  
	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-tag'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
	
    let tag = await Tag
      .find(id)

    let tag_g = new Tag
    tag_g.merge(await tag.toJSON())

    tag_g.generated_html = tag
      .setCompile('addensive')
      .setType('html')
      .generate()

    await tag.reload()

    tag_g.generated_gmod = tag
      .setCompile('standart')
      .setType('html')
      .generate()

    tag_g = await tag_g.toJSON()

    this.socket.emit('tagData', tag_g)
  }

  async onTagGenerate (data) {
    // let mctime = new Date

	if (this.request.user) {
		if (!(await this.request.user.hasPermissionTo('ap-mng-tag'))) {
			this.socket.close()
			return
		}
	} else {
		this.socket.close()
		return
	}
	
    let tag = new Tag

    tag.fill(data)

    let tag_g = new Tag
    tag_g.merge(await tag.toJSON())

    tag_g.generated_html = tag
      .setCompile('addensive')
      .setType('html')
      .generate()

    tag = new Tag

    tag.fill(data)

    // tag_g = tag

    tag_g.generated_gmod = tag
      .setCompile('standart')
      .setType('html')
      .generate()

    tag_g = await tag_g.toJSON()

    // console.log((new Date() - mctime)/1000 + ' sec')
    this.socket.emit('tagGenerate', {
      html: tag_g.generated_html,
      gmod: tag_g.generated_gmod
    })
  }
}

module.exports = TagsController
