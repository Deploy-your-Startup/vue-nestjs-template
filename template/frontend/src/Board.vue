<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  statuses,
  type Task,
  type Status,
  type CreateTask,
} from '../../shared/contracts';
import { api } from './api';

const route = useRoute();
const tasks = ref<Task[]>([]);
const search = ref('');
const category = ref('All categories');
const error = ref('');
const loading = ref(true);
const saving = ref(false);
const dialog = ref<HTMLDialogElement>();
const titleInput = ref<HTMLInputElement>();
const title = ref('');
const description = ref('');
const newCategory = ref<CreateTask['category']>('Product');
const pending = ref(new Set<string>());
const shippedOnly = computed(() => route.path === '/shipped');
const shipped = computed(
  () => tasks.value.filter((task) => task.status === 'shipped').length,
);
const progress = computed(() =>
  tasks.value.length
    ? Math.round((shipped.value / tasks.value.length) * 100)
    : 0,
);
const columns = computed(() =>
  shippedOnly.value ? (['shipped'] as const) : statuses,
);
const labels: Record<Status, string> = {
  backlog: 'Up next',
  building: 'In progress',
  shipped: 'Shipped',
};
const filtered = computed(() =>
  tasks.value.filter(
    (task) =>
      (category.value === 'All categories' ||
        task.category === category.value) &&
      `${task.title} ${task.description}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
);

watch(
  () => route.path,
  () => {
    search.value = '';
    category.value = 'All categories';
  },
);

onMounted(async () => {
  try {
    tasks.value = await api<Task[]>('/tasks');
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Could not load your workspace.';
  } finally {
    loading.value = false;
  }
});

function openDialog(): void {
  error.value = '';
  dialog.value?.showModal();
  titleInput.value?.focus();
}

async function createTask(): Promise<void> {
  saving.value = true;
  error.value = '';
  try {
    const task = await api<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: title.value,
        description: description.value,
        category: newCategory.value,
      }),
    });
    tasks.value.push(task);
    title.value = '';
    description.value = '';
    search.value = '';
    category.value = 'All categories';
    dialog.value?.close();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Could not add task.';
  } finally {
    saving.value = false;
  }
}

async function changeStatus(task: Task, status: Status): Promise<void> {
  pending.value.add(task.id);
  error.value = '';
  try {
    const updated = await api<Task>(`/tasks/${task.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    tasks.value = tasks.value.map((item) =>
      item.id === task.id ? updated : item,
    );
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Could not update task.';
  } finally {
    pending.value.delete(task.id);
  }
}

async function removeTask(task: Task): Promise<void> {
  pending.value.add(task.id);
  error.value = '';
  try {
    await api<void>(`/tasks/${task.id}`, { method: 'DELETE' });
    tasks.value = tasks.value.filter((item) => item.id !== task.id);
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Could not remove task.';
  } finally {
    pending.value.delete(task.id);
  }
}
</script>

<template>
  <section class="page-heading">
    <div>
      <div class="eyebrow">YOUR IDEAS, IN MOTION <span>✦</span></div>
      <h1>
        {{
          shippedOnly
            ? 'Look how far you’ve come.'
            : 'Small steps. Real progress.'
        }}
      </h1>
      <p>
        {{
          shippedOnly
            ? 'Every finished task is a little win. Here are yours.'
            : 'A little focus, a little momentum. Let’s bring your next idea to life.'
        }}
      </p>
    </div>
    <button v-if="!shippedOnly" class="primary" @click="openDialog">
      <span aria-hidden="true">+</span> New task
    </button>
  </section>

  <section class="summary-grid" aria-label="Workspace summary">
    <article class="summary-card">
      <div class="summary-label">
        On your radar <span class="stat-icon">▦</span>
      </div>
      <strong>{{ tasks.length }}<small>tasks</small></strong>
      <p>Good ideas start somewhere.</p>
    </article>
    <article class="summary-card">
      <div class="summary-label">
        Making it happen <span class="stat-icon amber">◐</span>
      </div>
      <strong
        >{{ tasks.filter((task) => task.status === 'building').length
        }}<small>in progress</small></strong
      >
      <p>A little closer than yesterday.</p>
    </article>
    <article class="summary-card">
      <div class="summary-label">
        Out in the world <span class="stat-icon green">↗</span>
      </div>
      <strong>{{ shipped }}<small>shipped</small></strong>
      <p>Small wins. Big possibilities.</p>
    </article>
  </section>

  <section class="momentum">
    <div class="momentum-symbol">✳</div>
    <div>
      <h2>You’re building momentum.</h2>
      <p>
        {{ shipped }} of {{ tasks.length }} tasks shipped. Keep going — it all
        adds up.
      </p>
    </div>
    <div class="progress-area">
      <div>
        <span>Your progress</span><strong>{{ progress }}%</strong>
      </div>
      <div class="progress-track">
        <div :style="{ width: `${progress}%` }"></div>
      </div>
    </div>
  </section>

  <section class="board-section" aria-label="Task board">
    <div class="board-toolbar">
      <div class="board-title">
        <h2>{{ shippedOnly ? 'Your finished work' : 'Your next chapter' }}</h2>
        <span>{{ shippedOnly ? shipped : tasks.length }}</span>
      </div>
      <div class="board-filters">
        <label class="search-box"
          ><span aria-hidden="true">⌕</span
          ><input
            v-model="search"
            type="search"
            placeholder="Find a task…"
            aria-label="Find a task" /></label
        ><select v-model="category" aria-label="Filter category">
          <option>All categories</option>
          <option>Product</option>
          <option>Design</option>
          <option>Engineering</option>
        </select>
      </div>
    </div>
    <p v-if="error && !dialog?.open" role="alert" class="error-banner">
      {{ error }}
    </p>
    <p v-if="loading" role="status" class="empty-state">
      Loading your workspace…
    </p>
    <div v-else class="board" :class="{ 'single-column': shippedOnly }">
      <section
        v-for="status in columns"
        :key="status"
        class="board-column"
        :aria-label="labels[status]"
      >
        <div class="column-heading">
          <h3>
            <span class="status-dot" :class="status"></span>{{ labels[status]
            }}<span class="count">{{
              filtered.filter((task) => task.status === status).length
            }}</span>
          </h3>
          <button
            v-if="status === 'backlog'"
            class="icon-button"
            aria-label="Add task to Up next"
            @click="openDialog"
          >
            +</button
          ><span v-else class="column-decoration" aria-hidden="true">{{
            status === 'shipped' ? '✓' : '◌'
          }}</span>
        </div>
        <article
          v-for="task in filtered.filter((task) => task.status === status)"
          :key="task.id"
          class="task-card"
          :aria-label="task.title"
        >
          <div class="task-top">
            <span class="category-tag" :class="task.category.toLowerCase()">{{
              task.category
            }}</span
            ><button
              class="delete-button"
              :disabled="pending.has(task.id)"
              :aria-label="`Delete ${task.title}`"
              @click="removeTask(task)"
            >
              ×
            </button>
          </div>
          <h4>{{ task.title }}</h4>
          <p>
            {{ task.description || 'A fresh idea, ready for your next step.' }}
          </p>
          <div class="task-bottom">
            <span class="task-avatar">Y</span
            ><select
              :value="task.status"
              :disabled="pending.has(task.id)"
              :aria-label="`Status for ${task.title}`"
              @change="
                changeStatus(
                  task,
                  ($event.target as HTMLSelectElement).value as Status,
                )
              "
            >
              <option v-for="value in statuses" :key="value" :value="value">
                {{ labels[value] }}
              </option>
            </select>
          </div>
        </article>
        <p
          v-if="!filtered.some((task) => task.status === status)"
          class="empty-state"
        >
          {{
            search || category !== 'All categories'
              ? 'No matching tasks.'
              : 'A little space for your next win.'
          }}
        </p>
        <button
          v-if="status === 'backlog'"
          class="add-task"
          @click="openDialog"
        >
          + <span>Add a task</span>
        </button>
      </section>
    </div>
  </section>

  <dialog
    ref="dialog"
    aria-labelledby="dialog-title"
    @click="$event.target === dialog && !saving && dialog?.close()"
    @cancel="saving && $event.preventDefault()"
  >
    <form @submit.prevent="createTask">
      <div class="dialog-heading">
        <div>
          <div class="eyebrow">ONE SMALL STEP</div>
          <h2 id="dialog-title">What’s next?</h2>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Close dialog"
          :disabled="saving"
          @click="dialog?.close()"
        >
          ×
        </button>
      </div>
      <p class="dialog-intro">Give your next idea a place to start.</p>
      <label
        >Task name<input
          ref="titleInput"
          v-model="title"
          required
          maxlength="120"
          pattern=".*\S.*"
          placeholder="Something worth building…" /></label
      ><label
        >A little more detail<textarea
          v-model="description"
          maxlength="1000"
          rows="3"
          placeholder="What would a small win look like?"
        /></label
      ><label
        >Category<select v-model="newCategory">
          <option>Product</option>
          <option>Design</option>
          <option>Engineering</option>
        </select></label
      >
      <p v-if="error" role="alert" class="error-banner">{{ error }}</p>
      <div class="dialog-actions">
        <button
          type="button"
          class="secondary"
          :disabled="saving"
          @click="dialog?.close()"
        >
          Cancel</button
        ><button class="primary" :disabled="saving">
          {{ saving ? 'Adding…' : 'Add task' }}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  </dialog>
</template>
