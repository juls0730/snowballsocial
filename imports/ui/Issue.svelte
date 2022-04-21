<script>
    import { Issues } from "../api/issues.js";
    import { Meteor } from "meteor/meteor";

    let user;

    $m: {
        user = Meteor.user();
    }

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
    {#if (user._id == issue.userId)}
        <button class="delete" on:click={deleteIssue}>Delete</button>
    {/if}
</div>
