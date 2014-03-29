module.exports = {
	"resources": {
		"monitor/monitors": {
			"id"       : "int            | pkey",
			"name"     : "string         | unique",
			"location" : "point",
			"gsmid"    : {
				type: "string",
				constraints: {
					unique: true,
					required: true,
					immutable: true,
					size: { max: 20 }
				}
			}
			_validate  : function( candidate, existing ) {
				// custom validation logic
			},
			_indices   : [], // Some indices to keep track of manually
			_pkey      : "id", // Another way to indicate this
			_delete    : function( obj ) {
				// Custom deletion logic, i.e. remove all reports
			}
			_auth      : function( obj, ctx ) {
				
			},
			_public    : false
		},
		"group/groups": {
			"id"       : "int            | pkey",
			"name"     : "string         | unique, required",
			"owner"    : "ref:accounts   | required"
		},
		"account/accounts": {
			"name"     : "string         | pkey, required"
		},
		"user/users": {
			"id"       : "int            | pkey",
			"fullname" : "string         | required",
			"phone"    : "string         | unique",
			"email"    : "string         | unique",
			"accounts" : "refset:accounts| required"
		},
		"alert/alerts": {
			"monitor" : "ref:monitor | pkey",
			"group"   : "ref:group"
		}
	}
}