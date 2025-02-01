{
  "targets": [
    {
      "target_name": "window",
       "product_name": "window",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "conditions":[
        ["OS=='win'", {
      	  "sources": [ "./src/native/win32/window.cc"]
      	}],
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ], # https://chatgpt.com/share/679d4b44-0cb4-8011-9eb6-8c12e182aec2
      "copies": [
        {
          "destination": "<(module_root_dir)/dist/native",
          "files": ["<(PRODUCT_DIR)/window.node"]
        }
      ]
    }
  ]
}
