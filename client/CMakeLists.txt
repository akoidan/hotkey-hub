cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)
cmake_policy(SET CMP0042 NEW)

project (window)

add_definitions(-DNAPI_VERSION=4)

include_directories(${CMAKE_JS_INC})

if(WIN32)
    set(SOURCE_FILES "${CMAKE_SOURCE_DIR}/src/native/win32/window-win32.cc" "${CMAKE_SOURCE_DIR}/src/native/win32/keypress-win32.c")
elseif (UNIX AND NOT APPLE)
    set(SOURCE_FILES "${CMAKE_SOURCE_DIR}/src/native/linux/window-linux.cc")
    find_package(X11 REQUIRED)
    find_package(PkgConfig REQUIRED)
    pkg_check_modules(XCB REQUIRED xcb xcb-ewmh)
    include_directories(${X11_INCLUDE_DIR} ${XCB_INCLUDE_DIRS})
elseif (UNIX AND APPLE)
    message(FATAL_ERROR "Unsupported OS")
else()
    message(FATAL_ERROR "Unsupported OS")
endif()

#target_include_directories(${PROJECT_NAME} PRIVATE "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")

add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

if(WIN32)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
elseif(UNIX)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${X11_LIBRARIES} ${XCB_LIBRARIES})
endif()

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
  # Generate node.lib
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()

if(WIN32)
    add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    "${CMAKE_SOURCE_DIR}/build/Release/window.node"
    "${CMAKE_SOURCE_DIR}/src/native/win32/window-win32.node"
    COMMENT "Copying window.node to src"
)
elseif(UNIX)
    add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    "${CMAKE_SOURCE_DIR}/build/Release/window.node"
    "${CMAKE_SOURCE_DIR}/src/native/linux/window-linux.node"
    COMMENT "Copying window.node to src"
)
else()
    message(FATAL_ERROR "Unsupported OS")
endif()
