"""Expose Kokoro's per-phoneme durations as a `duration` output so kokoro-onnx
can report when each phoneme (and so each word) is spoken."""
import sys

import onnx
from onnx import helper, TensorProto

src, dst = sys.argv[1], sys.argv[2]
model = onnx.load(src)
model.graph.node.append(helper.make_node("Identity", ["/encoder/Cast_output_0"], ["duration"]))
model.graph.output.append(helper.make_tensor_value_info("duration", TensorProto.INT64, None))
onnx.save(model, dst)
print("saved", dst)
