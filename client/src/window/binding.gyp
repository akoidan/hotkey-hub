{
  "targets": [
    {
      "target_name": "window",
       "product_name": "window",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "conditions":[
        ["OS=='win'", {
      	  "sources": [ "./os/win32/window.cc"]
      	}],
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
      "copies": [
        {
          "destination": "<(module_root_dir)/dist/native",
          "files": ["<(PRODUCT_DIR)/window.node"]
        }
      ]
    }
  ]
}
