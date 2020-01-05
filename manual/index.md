# CPMjs

This manual is under construction. It currently contains some basic instructions
on how to get started, but stay tuned for the most recent version! In
the meantime, see the [examples]()
(with provided [code](https://github.com/ingewortel/cpmjs/tree/master/examples))
and the full [method documentation](https://ingewortel.github.io/cpmjs.github.io/identifiers.html)
to get an idea of what you can do with CPMjs.


## Why CPMjs?

CPMjs implements Cellular Potts Models in JavaScript. Yep, you read it correctly:
JavaScript.

This somewhat unorthodox choice allowed us to harness some key strengths of web
programming to provide the following features:

- Build models in the form of interactive and explorable web
applications that:
    - you can easily share with other users without any fuss:
your audience needs no special software except a common web browser;
    - are just as fast as simulations in traditional modelling
frameworks!
- Unlocking CPM models for new users:
    - biologists can access & modify CPMjs models created by others
(collaborators, in publications) - without needing to program
anything themselves;
    - a large existing community of web programmers will be able to contribute
to the framework.


### Build, share, explore

Simulation models have traditionally been used by a small group of computational
biologists with the programming skills required to build them. While the
*results* from such models are shared with other biologists in the scientific
literature, the models themselves are typically not accessible for the target
audience.

We think this should change.

In the age of open science, let's make computational biology a little more
transparent. While sharing scripts and making code "open-source" is nice, it
still won't make simulation models accessible for a broad audience of biologists.

We built CPMjs to make simulation models accessible to anyone in three steps:

1. You build your model in the form of an explorable web application;
2. You **share** this page online either on a private website (before
publication), or as supplementary material to your paper;
3. You let users **explore** your model by allowing them to change parameters
with something as simple as a mouse click.


We believe this approach comes with some nice benefits:
- **Reviewers** can get a feel of how your model behaves. This will help them
assess the robustness and validity of results presented in a paper - speeding up
the peer review process and improving the quality of the scientific literature.
- **Readers** can access a simulation as supplementary material to your paper,
without needing any special software. This will help them understand your
models in more detail, and build on their conclusions with novel ideas.
- **Collaborators** with experimental expertise can be involved in the modelling
process earlier on, which will foster more close collaborations and improve the
exchange of ideas.
- **Students** can be exposed to simulation modelling early on in their program,
promoting the use of computational models by a larger audience.


### But what about speed?

Because simulation models tend to be computationally expensive, modelling
frameworks have traditionally been written in languages with a reputation to
be fast - such as C++ and Java. A modelling framework implemented in a
scripting language may therefore come as a surprise. But improvements in the
JavaScript engines powering common web browsers mean that performance is no
longer an issue: CPMjs lets you build simulations as web applications without
loss of speed.




