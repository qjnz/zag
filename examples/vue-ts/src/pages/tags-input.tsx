import { defineComponent } from "@vue/runtime-core"
import { computed, h, Fragment } from "vue"
import { useMachine, normalizeProps } from "@ui-machines/vue"
import { tagsInput } from "@ui-machines/web"
import { useMount } from "../hooks/use-mount"
import { css } from "@emotion/css"

const styles = css`
  .tags-input {
    display: inline-block;
    padding: 0 2px;
    background: #fff;
    border: 1px solid #ccc;
    width: 40em;
    border-radius: 2px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .tag {
    background: #eee;
    color: #444;
    padding: 0 4px;
    margin: 2px;
    border: 1px solid #ccc;
    border-radius: 2px;
    font: inherit;
    user-select: none;
    cursor: pointer;
    transition: all 100ms ease;
  }

  .tag:not([hidden]) {
    display: inline-block;
  }

  .tag[hidden] {
    display: none !important;
  }

  .tag[data-selected] {
    background-color: #777;
    border-color: #777;
    color: #eee;
  }

  input {
    appearance: none !important;
    padding: 3px;
    margin: 0 !important;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    font: inherit !important;
    font-size: 100% !important;
    outline: none !important;
  }

  input[hidden] {
    display: none !important;
  }

  input:not([hidden]) {
    display: inline-block !important;
  }

  .tag-close {
    border: 0;
    background: inherit;
  }
`

export default defineComponent({
  name: "TagsInput",
  setup() {
    const [state, send] = useMachine(
      tagsInput.machine.withContext({
        uid: "uid",
        value: ["React", "Vue"],
      }),
    )

    const ref = useMount(send)

    const mp = computed(() => tagsInput.connect(state.value, send, normalizeProps))

    return () => {
      return (
        <div className={styles}>
          <div ref={ref} {...mp.value.rootProps} className="tags-input">
            {state.value.context.value.map((value, index) => (
              <span key={index}>
                <div className="tag" {...mp.value.getTagProps({ index, value })}>
                  <span>{value} </span>
                  <button className="tag-close" {...mp.value.getTagDeleteButtonProps({ index, value })}>
                    &#x2715;
                  </button>
                </div>
                <input style={{ width: 40 }} {...mp.value.getTagInputProps({ index })} />
              </span>
            ))}
            <input placeholder="Add tag..." {...mp.value.inputProps} />
          </div>
        </div>
      )
    }
  },
})
