<script lang="ts">
  import { useQuery, useMutation } from 'convex-svelte';
  import { api } from '$convex/_generated/api';
  import { SignedIn, SignedOut, SignInButton } from 'svelte-clerk';

  const tasks = useQuery(api.tasks.list, {});
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);

  let newTaskText = $state('');
  let isSubmitting = $state(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const text = newTaskText.trim();
    if (!text || isSubmitting) return;

    isSubmitting = true;
    try {
      await createTask({ text });
      newTaskText = '';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<SignedOut>
  <div class="rounded-xl border border-border bg-card p-12 text-center text-card-foreground shadow-sm max-w-xl mx-auto my-12">
    <h1 class="text-3xl font-extrabold tracking-tight mb-3">Welcome to Your App</h1>
    <p class="text-muted-foreground text-base mb-8">Sign in to start creating and saving your items with instant real-time sync.</p>
    <SignInButton mode="modal" class="inline-flex items-center justify-center rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 transition-colors cursor-pointer shadow-sm">
      Sign In to Get Started
    </SignInButton>
  </div>
</SignedOut>

<SignedIn>
  <section class="rounded-xl border border-border bg-card p-6 md:p-8 text-card-foreground shadow-sm">
    <div class="flex items-center justify-between mb-1">
      <h2 class="text-2xl font-bold tracking-tight">Your Saved Items</h2>
      <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        Live Sync
      </span>
    </div>
    <p class="text-sm text-muted-foreground mb-6">Anything you add updates instantly across your phone and computer.</p>

    <form onsubmit={handleSubmit} class="flex gap-2 mb-6">
      <input
        type="text"
        bind:value={newTaskText}
        placeholder="Add a new item..."
        disabled={isSubmitting}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isSubmitting || !newTaskText.trim()}
        class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer shrink-0"
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>

    {#if $tasks.isLoading}
      <div class="rounded-lg border border-border/50 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        <p>Loading your items...</p>
      </div>
    {:else if $tasks.error}
      <div class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
        <p>Could not load items: {$tasks.error.toString()}</p>
      </div>
    {:else if $tasks.data?.length === 0}
      <div class="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        <p>No items yet. Type something above and click Add!</p>
      </div>
    {:else}
      <ul class="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {#each $tasks.data ?? [] as task (task._id)}
          <li class="p-4 hover:bg-muted/30 transition-colors">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={task.isCompleted}
                onchange={() => toggleTask({ id: task._id })}
                class="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
              />
              <span class="text-sm font-medium transition-all {task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}">
                {task.text}
              </span>
            </label>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</SignedIn>
