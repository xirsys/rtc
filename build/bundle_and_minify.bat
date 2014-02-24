cd ..\Scripts\xRtc

java -jar ..\..\tools\closure-compiler\compiler.jar --compilation_level WHITESPACE_ONLY --formatting pretty_print --js dependencies\BinaryPack.js ajax.js eventDispatcher.js common.js class.js commonError.js logger.js authManager.js stream.js dataChannel.js connection.js handshakeController.js serverConnector.js room.js userMedia.js --js_output_file ..\..\scripts\xrtc-1.5.0.js

java -jar ..\..\tools\closure-compiler\compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --create_source_map ..\..\scripts\xrtc-1.5.0.min.map --js dependencies\BinaryPack.js ajax.js eventDispatcher.js common.js class.js commonError.js logger.js authManager.js stream.js dataChannel.js connection.js handshakeController.js serverConnector.js room.js userMedia.js --js_output_file ..\..\scripts\xrtc-1.5.0.min.js

