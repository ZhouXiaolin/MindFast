import { init, Tiktoken } from "tiktoken/lite/init";
import cl100kBase from "tiktoken/encoders/cl100k_base";
import wasmUrl from "tiktoken/lite/tiktoken_bg.wasm?url";

let encoderPromise: Promise<Tiktoken> | null = null;

async function getEncoder(): Promise<Tiktoken> {
  if (!encoderPromise) {
    encoderPromise = (async () => {
      await init(async (imports) => {
        const response = await fetch(wasmUrl);
        if ("instantiateStreaming" in WebAssembly) {
          try {
            return await WebAssembly.instantiateStreaming(response, imports);
          } catch {
            // Some webviews serve the wasm with an unsupported MIME type.
          }
        }

        const bytes = await response.arrayBuffer();
        return WebAssembly.instantiate(bytes, imports);
      });

      return new Tiktoken(
        cl100kBase.bpe_ranks,
        cl100kBase.special_tokens,
        cl100kBase.pat_str
      );
    })();
  }

  return encoderPromise;
}

export async function countTextTokens(text: string): Promise<number> {
  if (!text.trim()) return 0;
  return (await getEncoder()).encode(text).length;
}
