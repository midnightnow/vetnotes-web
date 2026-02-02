<script lang="ts">
    export let type: "primary" | "secondary" | "ghost" = "primary";
    export let size: "sm" | "md" | "lg" = "md";

    const baseClasses =
        "relative font-bold transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none border-2 flex items-center justify-center gap-2 mb-0.5";

    const variants = {
        primary:
            "bg-white text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50",
        secondary:
            "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:bg-neutral-800",
        ghost: "bg-white/10 backdrop-blur-md text-white border-white/20 shadow-none hover:bg-white/20",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-[10px] tracking-wider uppercase",
        md: "px-5 py-2.5 text-xs tracking-wide",
        lg: "px-8 py-4 text-base tracking-tight",
    };
</script>

<button
    class="{baseClasses} {variants[type]} {sizes[size]} rounded-sm"
    on:click
>
    <slot />
</button>
