import { StateMachine as S } from "@ui-machines/core"
import { dataAttr, EventKeyMap, getEventKey, getNativeEvent, nextTick, validateBlur } from "@ui-machines/dom-utils"
import { normalizeProp, PropTypes, ReactPropTypes } from "@ui-machines/types"
import { dom } from "./tags-input.dom"
import { MachineContext, MachineState } from "./tags-input.types"

type TagProps = {
  index: string | number
  value: string
}

export function connect<T extends PropTypes = ReactPropTypes>(
  state: S.State<MachineContext, MachineState>,
  send: (event: S.Event<S.AnyEventObject>) => void,
  normalize = normalizeProp,
) {
  const { context: ctx } = state

  const isInputFocused = state.matches("focused:input", "navigating:tag")
  const isEditingTag = state.matches("editing:tag")

  return {
    // state
    value: ctx.value,
    valueAsString: ctx.valueAsString,

    // methods
    clear() {
      send("CLEAR_ALL")
    },
    add(value: string) {
      send({ type: "ADD_TAG", value })
    },
    delete(id: string) {
      send({ type: "DELETE_TAG", id })
    },
    focus() {
      nextTick(() => {
        dom.getInputEl(ctx)?.focus()
      })
    },
    blur() {
      dom.getInputEl(ctx)?.blur()
    },

    // attributes
    rootProps: normalize.element<T>({
      "data-part": "root",
      "data-invalid": dataAttr(ctx.outOfRange),
      "data-disabled": dataAttr(ctx.disabled),
      "data-focus": dataAttr(isInputFocused),
      id: dom.getRootId(ctx),
      onPointerDown() {
        if (!ctx.isInteractive) return
        send("POINTER_DOWN")
      },
    }),

    inputProps: normalize.input<T>({
      "data-part": "input",
      id: dom.getInputId(ctx),
      value: ctx.inputValue,
      autoComplete: "off",
      disabled: ctx.disabled,
      onChange(event) {
        const evt = getNativeEvent(event)
        if (evt.isComposing || evt.inputType === "insertFromPaste") return
        send({ type: "TYPE", value: event.target.value })
      },
      onFocus() {
        send("FOCUS")
      },
      onBlur(event) {
        const isValidBlur = validateBlur(event, {
          exclude: dom.getRootEl(ctx),
        })
        if (isValidBlur) {
          send("BLUR")
        }
      },
      onPaste(event) {
        const value = event.clipboardData.getData("text/plain")
        send({ type: "PASTE", value })
      },
      onKeyDown(event) {
        const evt = getNativeEvent(event)
        if (evt.isComposing) return
        const keyMap: EventKeyMap = {
          ArrowDown() {
            send("ARROW_DOWN")
          },
          ArrowLeft() {
            send("ARROW_LEFT")
          },
          ArrowRight() {
            if (ctx.focusedId) {
              event.preventDefault()
            }
            send("ARROW_RIGHT")
          },
          Escape(event) {
            event.preventDefault()
            send("ESCAPE")
          },
          Backspace() {
            send("BACKSPACE")
          },
          Delete() {
            send("DELETE")
          },
          Comma(event) {
            event.preventDefault()
            send("COMMA")
          },
          Enter(event) {
            event.preventDefault()
            send("ENTER")
          },
        }

        const key = getEventKey(event, ctx)
        const exec = keyMap[key]
        exec?.(event)
      },
    }),

    hiddenInputProps: normalize.input<T>({
      "data-part": "hidden-input",
      type: "hidden",
      name: ctx.name,
      id: dom.getHiddenInputId(ctx),
      value: ctx.valueAsString,
    }),

    getTagProps({ index, value }: TagProps) {
      const id = dom.getTagId(ctx, index)
      return normalize.element<T>({
        "data-part": "tag",
        id,
        hidden: isEditingTag ? ctx.editedId === id : false,
        "data-value": value,
        "data-disabled": dataAttr(ctx.disabled),
        "data-selected": dataAttr(id === ctx.focusedId),
        "data-ownedby": dom.getRootId(ctx),
        onPointerDown(event) {
          if (!ctx.isInteractive) return
          event.preventDefault()
          send({ type: "POINTER_DOWN_TAG", id })
        },
        onDoubleClick() {
          if (!ctx.isInteractive) return
          send({ type: "DOUBLE_CLICK_TAG", id })
        },
      })
    },

    getTagInputProps({ index }: { index: number }) {
      const id = dom.getTagId(ctx, index)
      const active = ctx.editedId === id
      return normalize.input<T>({
        "data-part": "tag-input",
        id: dom.getTagInputId(ctx, index),
        type: "text",
        tabIndex: -1,
        hidden: isEditingTag ? !active : true,
        value: active ? ctx.editedTagValue : "",
        onChange(event) {
          send({ type: "TAG_INPUT_TYPE", value: event.target.value })
        },
        onBlur() {
          send("TAG_INPUT_BLUR")
        },
        onKeyDown(event) {
          const keyMap: EventKeyMap = {
            Enter() {
              send("TAG_INPUT_ENTER")
            },
            Escape() {
              send("TAG_INPUT_ESCAPE")
            },
          }

          const exec = keyMap[event.key]

          if (exec) {
            event.preventDefault()
            exec(event)
          }
        },
      })
    },

    getTagDeleteButtonProps({ index, value }: TagProps) {
      const id = dom.getTagId(ctx, index)
      return normalize.button<T>({
        "data-part": "delete-button",
        id: dom.getTagDeleteBtnId(ctx, index),
        type: "button",
        "aria-label": `Delete ${value}`,
        tabIndex: -1,
        onPointerDown(event) {
          if (!ctx.isInteractive) {
            event.preventDefault()
          }
        },
        onPointerOver() {
          if (!ctx.isInteractive) return
          send({ type: "HOVER_DELETE_TAG", id })
        },
        onClick() {
          if (!ctx.isInteractive) return
          send({ type: "DELETE_TAG", id })
        },
      })
    },

    clearButtonProps: normalize.button<T>({
      "data-part": "clear-button",
      id: dom.getClearButtonId(ctx),
      type: "button",
      "aria-label": "Clear all tags",
      hidden: ctx.count === 0,
      onClick() {
        if (!ctx.isInteractive) return
        send("CLEAR_ALL")
      },
    }),
  }
}
