'use strict'

const _ = require('async-dash')

class PermissionCan {
  async wsHandle ({ response, request, socket }, next, properties) {
    // Upstream code...
	// console.log(request.user)
	if (request.user)
	{
		let can = false
		await _.asyncEach(properties, async (slug) => {
			if ((await request.user.hasPermissionTo(slug))) {
				can = true
			}
		})

		if (!can) {
			socket.close()
			return
		}
	}
	else
	{
		return
	}
	console.log('next')
    await next()
    // Downstream code...
  }
}

module.exports = PermissionCan
