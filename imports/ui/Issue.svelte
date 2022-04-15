<script>
    import { Issues } from "../api/issues.js";

    function deleteIssue() {
        Issues.remove(issue._id);
    }

    export let issue;
</script>

<div class="issue-div">
    <h1>{issue.title}</h1>
    <p>{issue.description}</p>
    <p>priority: {issue.priority}</p>
    <p class="due-date">Due by: {issue.dueDate}</p>
    <div>
        <button class="delete" on:click={deleteIssue}>
            Delete
        </button>
    </div>
</div>
