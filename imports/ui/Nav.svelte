<script>
    const logout = () => Meteor.logout();
</script>

<nav class="nav-list">
    <ul>
        <li><a href="/">SnowballSocial</a></li>
        <div class="end">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/issues">Issues</a></li>
            <li><a href="/new-issue">New Issue</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/" on:click={logout}>Logout</a></li>
        </div>
    </ul>
</nav>
