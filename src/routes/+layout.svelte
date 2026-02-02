<script>
	import "../app.css";
	import GlobalNav from "$lib/components/GlobalNav.svelte";
	import { page } from "$app/stores";
</script>

<div class="relative min-h-screen">
	{#if $page.url.pathname !== "/"}
		<GlobalNav />
	{/if}
	<main>
		<slot />
	</main>
</div>
