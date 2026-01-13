<script lang="ts">
	import BlindRecorder from '$lib/components/BlindRecorder.svelte';
</script>

<div class="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
	<h1 class="text-4xl font-bold mb-8 text-primary">VetNotes<span class="text-xs text-base-content/50 align-top ml-1">MVP</span></h1>
	
	<BlindRecorder />
	
	<div class="mt-12 text-center text-sm text-base-content/30 max-w-md">
		<p>Sovereign Mode Active</p>
		<p>Audio RAM-Only • No Cloud Upload</p>
	</div>
</div>
