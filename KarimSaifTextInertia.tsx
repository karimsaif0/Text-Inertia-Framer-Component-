/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import {
    addPropertyControls,
    ControlType,
    useIsStaticRenderer,
    useReducedMotion,
} from "framer"
import { useEffect, useMemo, useRef } from "react"

interface Props {
    text: string
    font: any
    fontSize: number
    letterSpacing: number
    lineHeight: number
    color: string
    strength: number
    velocity: number
    rotation: number
    elasticity: number
    align: "left" | "center" | "right"
    disabled: boolean
}

interface WordState {
    element: HTMLSpanElement
    x: number
    y: number
    angle: number
    vx: number
    vy: number
    va: number
    targetX: number
    targetY: number
    targetAngle: number
}

interface PointerState {
    x: number
    y: number
    vx: number
    vy: number
    active: boolean
}

export default function KarimSaifTextInertia(props: Props) {
    const {
        text,
        font,
        fontSize,
        letterSpacing,
        lineHeight,
        color,
        strength,
        velocity,
        rotation,
        elasticity,
        align,
        disabled,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const wordsRef = useRef<WordState[]>([])
    const frameRef = useRef<number | null>(null)
    const visibleRef = useRef(false)

    const pointerRef = useRef<PointerState>({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        active: false,
    })

    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const words = useMemo(() => {
        const value = typeof text === "string" ? text.trim() : ""
        return value.length > 0 ? value.split(/\s+/) : []
    }, [text])

    const fontFamily =
        font && typeof font === "object" && typeof font.family === "string"
            ? font.family
            : "Inter"

    const fontWeight =
        font && typeof font === "object" && font.weight != null
            ? font.weight
            : 700

    const fontStyle =
        font && typeof font === "object" && typeof font.style === "string"
            ? font.style
            : "normal"

    const justifyContent =
        align === "left"
            ? "flex-start"
            : align === "right"
              ? "flex-end"
              : "center"

    useEffect(() => {
        const root = rootRef.current
        if (!root) return

        const elements = Array.from(
            root.querySelectorAll<HTMLSpanElement>(
                "[data-karim-saif-text-inertia-word]"
            )
        )

        wordsRef.current = elements.map((element) => ({
            element,
            x: 0,
            y: 0,
            angle: 0,
            vx: 0,
            vy: 0,
            va: 0,
            targetX: 0,
            targetY: 0,
            targetAngle: 0,
        }))

        visibleRef.current = false

        if (
            staticRenderer ||
            reducedMotion ||
            disabled ||
            elements.length === 0
        ) {
            return
        }

        const pointer = pointerRef.current

        pointer.x = 0
        pointer.y = 0
        pointer.vx = 0
        pointer.vy = 0
        pointer.active = false

        const stopAnimation = () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }

        const animate = () => {
            if (!visibleRef.current) {
                frameRef.current = null
                return
            }

            const wordsState = wordsRef.current

            for (let index = 0; index < wordsState.length; index++) {
                const word = wordsState[index]

                word.vx += (word.targetX - word.x) * elasticity
                word.vy += (word.targetY - word.y) * elasticity
                word.va += (word.targetAngle - word.angle) * elasticity

                word.vx *= 0.76
                word.vy *= 0.76
                word.va *= 0.74

                word.x += word.vx
                word.y += word.vy
                word.angle += word.va

                word.x *= 0.88
                word.y *= 0.88
                word.angle *= 0.86

                word.element.style.transform =
                    `translate3d(${word.x}px, ${word.y}px, 0) ` +
                    `rotate(${word.angle}deg)`
            }

            pointer.vx *= 0.82
            pointer.vy *= 0.82

            frameRef.current = requestAnimationFrame(animate)
        }

        const startAnimation = () => {
            if (!visibleRef.current || frameRef.current !== null) {
                return
            }

            frameRef.current = requestAnimationFrame(animate)
        }

        const handlePointerMove = (event: PointerEvent) => {
            const nextX = event.clientX
            const nextY = event.clientY

            if (!pointer.active) {
                pointer.x = nextX
                pointer.y = nextY
                pointer.vx = 0
                pointer.vy = 0
                pointer.active = true
                return
            }

            const dx = nextX - pointer.x
            const dy = nextY - pointer.y

            pointer.x = nextX
            pointer.y = nextY

            pointer.vx = Math.max(-80, Math.min(80, dx))
            pointer.vy = Math.max(-80, Math.min(80, dy))
        }

        const handlePointerLeave = () => {
            pointer.vx = 0
            pointer.vy = 0
            pointer.active = false
        }

        const enterHandlers = new Map<HTMLSpanElement, () => void>()
        const leaveHandlers = new Map<HTMLSpanElement, () => void>()

        elements.forEach((element, index) => {
            const handleEnter = () => {
                if (!visibleRef.current) return

                const word = wordsRef.current[index]
                if (!word) return

                const pushX = pointer.vx * velocity * strength
                const pushY = pointer.vy * velocity * strength
                const pushAngle =
                    pointer.vx * 0.2 * rotation +
                    pointer.vy * 0.05 * rotation

                word.vx += pushX
                word.vy += pushY
                word.va += pushAngle

                word.targetX = Math.max(-160, Math.min(160, pushX))
                word.targetY = Math.max(-160, Math.min(160, pushY))
                word.targetAngle = Math.max(-45, Math.min(45, pushAngle))

                startAnimation()
            }

            const handleLeave = () => {
                const word = wordsRef.current[index]
                if (!word) return

                word.targetX = 0
                word.targetY = 0
                word.targetAngle = 0

                if (visibleRef.current) {
                    startAnimation()
                }
            }

            enterHandlers.set(element, handleEnter)
            leaveHandlers.set(element, handleLeave)

            element.addEventListener("pointerenter", handleEnter)
            element.addEventListener("pointerleave", handleLeave)
        })

        root.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })

        root.addEventListener("pointerleave", handlePointerLeave, {
            passive: true,
        })

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return

                const isVisible =
                    entry.isIntersecting && entry.intersectionRatio > 0

                visibleRef.current = isVisible

                if (isVisible) {
                    startAnimation()
                } else {
                    stopAnimation()
                    pointer.vx = 0
                    pointer.vy = 0
                    pointer.active = false
                }
            },
            {
                threshold: 0,
            }
        )

        observer.observe(root)

        return () => {
            observer.disconnect()
            stopAnimation()

            root.removeEventListener("pointermove", handlePointerMove)
            root.removeEventListener("pointerleave", handlePointerLeave)

            elements.forEach((element) => {
                const enterHandler = enterHandlers.get(element)
                const leaveHandler = leaveHandlers.get(element)

                if (enterHandler) {
                    element.removeEventListener("pointerenter", enterHandler)
                }

                if (leaveHandler) {
                    element.removeEventListener("pointerleave", leaveHandler)
                }

                element.style.transform =
                    "translate3d(0px, 0px, 0px) rotate(0deg)"
            })

            pointer.vx = 0
            pointer.vy = 0
            pointer.active = false
            visibleRef.current = false
            wordsRef.current = []
        }
    }, [
        text,
        strength,
        velocity,
        rotation,
        elasticity,
        disabled,
        staticRenderer,
        reducedMotion,
    ])

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent,
                overflow: "visible",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    justifyContent,
                    fontFamily,
                    fontWeight,
                    fontStyle,
                    fontSize,
                    lineHeight,
                    letterSpacing,
                    color,
                    textAlign: align,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    boxSizing: "border-box",
                    overflow: "visible",
                }}
            >
                {words.map((word, index) => (
                    <span
                        key={`${word}-${index}`}
                        data-karim-saif-text-inertia-word
                        style={{
                            display: "inline-block",
                            whiteSpace: "pre",
                            marginRight:
                                index < words.length - 1
                                    ? fontSize * 0.12
                                    : 0,
                            willChange: disabled ? "auto" : "transform",
                            transform:
                                "translate3d(0px, 0px, 0px) rotate(0deg)",
                            cursor: disabled ? "default" : "pointer",
                            touchAction: "pan-y",
                        }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </div>
    )
}

KarimSaifTextInertia.displayName = "Karim Saif Text Inertia"

addPropertyControls(KarimSaifTextInertia, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "HEY KARIM",
        description: "Sets the text displayed by the component.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            family: "Inter",
            style: "normal",
            weight: 700,
        },
        description: "Controls the font family, style, and weight.",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 96,
        min: 8,
        max: 300,
        step: 1,
        unit: "px",
        description: "Controls the size of the text.",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: -3,
        min: -30,
        max: 50,
        step: 0.5,
        unit: "px",
        description: "Controls the spacing between letters.",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.05,
        description: "Controls the vertical spacing of the text.",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
        description: "Controls the color of the text.",
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.05,
        description:
            "Controls how far each word moves in response to the cursor.",
    },
    velocity: {
        type: ControlType.Number,
        title: "Velocity",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.05,
        description:
            "Controls how strongly cursor movement affects the interaction.",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.05,
        description:
            "Controls the amount of rotation applied during interaction.",
    },
    elasticity: {
        type: ControlType.Number,
        title: "Elasticity",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.3,
        step: 0.01,
        description:
            "Controls how quickly each word follows and returns from its target.",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        description: "Controls the horizontal alignment of the text.",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Disables cursor interaction while keeping the text visible.",
    },
})
