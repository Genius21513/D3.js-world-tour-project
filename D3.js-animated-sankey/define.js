// https://observablehq.com/@oluckyman/sankey-animation-acyclic-graph@3056
// import define1 from "./d959884acd1622a0@594.js";

function _title(md) {
  return (
    md`You can show 3400's fake data.`
  )
}

function _2(md) {
  return (
    md``
  )
}

function _3(md) {
  return (
    md``
  )
}

function _reset(html) {
  return (    
    html`<button>RESET`
  )
}

function _timer(chart) {
  let elapsed = 0
  // This is a native JS way to trigger a function 60 times per second
  requestAnimationFrame(function update() {
    chart.update(elapsed++)
    requestAnimationFrame(update)
  })
  return /code block/
}


function _speed() {
  return (
    2
  )
}

function _totalParticles(d3, targetsAbsolute) {
  return (
    d3.sum(targetsAbsolute, t => t.value)
  )
}

function _density() {
  return (
    7
  )
}

function _chart(d3, DOM, width, height, margin, routes, sankeyLinkCustom, bandHeight, 
    cache, sankey, leaves, colorScale, addParticlesMaybe, particles, totalParticles, psize) {      
      // width = 1050, height = 500;
  const svg = d3.select(DOM.svg(width, height))
  const g = svg.append('g')
            // .attr('class', 'g-cont')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Apart from aesthetics, routes serve as trajectories for the moving particles.
  // We'll compute particle positions in the next step
  //
  const route = g.append("g").attr('class', 'routes')
    .attr("fill", "none")
    .attr("stroke-opacity", .1)
    .attr("stroke", "#ddd")
    .selectAll("path").data(routes)
    .join("path")
    // use custom sankey function because we want nodes and links to be of equal height
    .attr('d', sankeyLinkCustom)
    .attr("stroke-width", bandHeight)


  // Compute particle positions along the routes.
  // This technic relies on path.getPointAtLength function that returns coordinates of a point on the path
  // Another example of this technic:
  // https://observablehq.com/@oluckyman/point-on-a-path-detection
  //
  route.each(function (nodes) {    
    const path = this
    const length = path.getTotalLength()
    const points = d3.range(length).map(l => {
      const point = path.getPointAtLength(l)      
      return { x: point.x, y: point.y }
    })
    // store points for each route in the cache to use during the animation
    const lastNode = nodes[nodes.length - 1]
    const key = '/' + nodes.map(n => n.name).join('/')
    cache[key] = { points }
  })

  // Create a container for particles first,
  // to keep particles below the labels which are declared next
  const particlesContainer = g.append('g')
                              .attr('class', 'p-container')

  // Labels
  //
  g.selectAll('.label').data(sankey.nodes) // `.slice(1)` to skip the root node
    .join('g').attr('class', 'label')
    .attr('transform', d => `translate(${d.x1 - bandHeight / 2}, ${d.y0 + bandHeight / 2})`)
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'end')
    // This is how we make labels visible on multicolor background
    // we create two <text> with the same label
    .call(label => label.append('text')
      // the lower <text> serves as outline to make contrast
      .attr('stroke', 'white')
      .attr('stroke-width', 3)
      .text(d => d.name))
    // the upper <text> is the actual label
    .call(label => label.append('text')
      .attr('fill', '#444')
      .text(d => d.name))


  // Counters  //
  const counters = g.selectAll('.counter').data(leaves)
    .join('g').attr('class', 'counter')
    .attr('transform', d => `translate(${width - margin.left}, ${d.node.y0 - 20})`)
    .each(function (leaf, i) {
      d3.select(this).selectAll('.group').data(['males', 'females'])
        .join('g').attr('class', 'group')
        .attr('transform', (d, i) => `translate(${-i * 60}, 0)`)
        // Align coutners to the right, because running numbers are easier for the eye to compare this way
        .attr('text-anchor', 'end')
        // Use monospaced font to keep digits aligned as they change during the animation
        .style('font-family', 'Menlo')
        // Add group titles only once, on the top
        .call(g => i === 0 && g.append('text')
          .attr('dominant-baseline', 'hanging')
          .attr('fill', '#999')
          .style('font-size', 9)
          .style('text-transform', 'uppercase')          
          .style('letter-spacing', .7) // a rule of thumb: increase letter spacing a bit, when use uppercase
          .text(d => d)
        )
        // Absolute counter values
        .call(g => g.append('text').attr('class', 'absolute')
          .attr('fill', d => colorScale(d))
          .attr('font-size', 20)
          .attr('dominant-baseline', 'middle')
          .attr('y', bandHeight / 2 - 2)
          .text(0) // will be updated during the animation
        )
        // Percentage counter values
        .call(g => g.append('text').attr('class', 'percent')
          .attr('dominant-baseline', 'hanging')
          .attr('fill', '#999')
          .attr('font-size', 9)
          .attr('y', bandHeight / 2 + 9)
          .text('0%')  // will be updated during the animation
        )
    })


  // Instead of `return svg.node()` we do this trick.
  // It's needed to expose `update` function outside of this cell.
  // It's Observable-specific, you can see more animations technics here:
  // https://observablehq.com/@d3/learn-d3-animation?collection=@d3/learn-d3
  //  
  return Object.assign(svg.node(), {
    // update will be called on each tick, so here we'll perform our animation step
    update(t) {
      // add particles if needed
      // 
      if (particles.length < totalParticles) {
        addParticlesMaybe(t)
      }      

      // set the numbers of particles
      d3.select("#ended_nums").text(particles.length)

      // update counters
      //
      counters.each(function (d) {
        const finished = particles
          .filter(p => p.target.name === d.node.name)
          .filter(p => p.pos >= p.length)

        d3.select(this).selectAll('.group').each(function (group) {
          const count = finished.filter(p => p.target.group === group).length
          d3.select(this).select('.absolute').text(count)
          d3.select(this).select('.percent').text(d3.format('.0%')(count / totalParticles))
        })
      })

      // move particles
      //
      particlesContainer.selectAll('.particle').data(particles.filter(p => p.pos < p.length), d => d.id)
        .join(
          enter => enter.append('rect')
            .attr('class', 'particle')
            .attr('opacity', 0.8)
            .attr('fill', d => d.color)
            .attr('width', psize)
            .attr('height', psize),
          update => update,
          exit => exit.remove()
          //.remove() // uncomment to remove finished particles
        )
        // At this point we have `cache` with all possible coordinates.
        // We just need to figure out which exactly coordinates to use at time `t`
        //
        .each(function (d) {
          // every particle appears at its own time, so adjust the global time `t` to local time
          const localTime = t - d.createdAt
          d.pos = localTime * d.speed
          // extract the current and the next point coordinates from the precomputed cache
          const index = Math.floor(d.pos)
          const coo = cache[d.target.path].points[index]
          const nextCoo = cache[d.target.path].points[index + 1]
          if (coo && nextCoo) {
            // `index` is integer, but `d.pos` is float, so there are ticks when a particle is 
            // between the two precomputed points. We use `delta` to compute position between the current
            // and the next coordinates to make the animation smoother
            const delta = d.pos - index // try to set it to 0 to see how jerky the animation is
            const x = coo.x + (nextCoo.x - coo.x) * delta
            const y = coo.y + (nextCoo.y - coo.y) * delta

            d3.select(this)
              .attr('x', x)
              .attr('y', y + d.offset)
              
            return;

          //   // squeeze particles when they close to finish            
          //   let xx = cache[d.target.path].points[d.length - 1].x;
          //   const lastX = xx ? xx: width;
          //   const squeezeFactor = Math.max(0, psize - (lastX - x)) // gets from 0 to `psize`, when finish
          //   const h = Math.max(2, psize - squeezeFactor) // gets from `psize` to 2
          //   const dy = (psize - h) / 2 // increases as the particle squeezes, to keep it centered
          //   const w = psize + squeezeFactor // the width increses twice, when finish
          //   const dx = squeezeFactor / 2 // compensates x position when the width increases
          //   d3.select(this)
          //     .attr('x', x - dx)
          //     .attr('y', y + d.offset + dy)
          //     .attr('height', h)
          //     .attr('width', w)
          }
        })
    }
  })
}


function _cache() {
  return (
    {}
  )
}

function _particles(reset) { // will be populated during the chart updating
  reset // this is Observable way to reset this cell when `reset` button is pressed
  return []
}


function ___DATA__(md) {
  return (
    md``
  )
}

function _raw() {
  return (
    {
      // This is single tunel
      // All routes start from 'root' node.
      // If you pass through more routes, use template : { "xx" : { "yy" : { ... } } }
        "601": { males: 135, females: 130 },
        "602": { males: 155, females: 135 },
        "603": { males: 215, females: 180 },
        "604": { males: 1127, females: 113 },
        "605": { males: 1153, females: 157 }
    }
  )
}

function _14(md) {
  return (
    md``
  )
}

function _nodes(raw) {
  const isLeaf = n => n.hasOwnProperty('males')
  const nodes = ['root']
  const walk = node => {
    for (let name in node) {
      nodes.push(name)
      if (!isLeaf(node[name])) {
        walk(node[name])
      }
    }
  }  
  walk(raw)  
  return [...new Set(nodes)].map(name => ({ name }))
}


function _links(raw) {
  const isLeaf = n => n.hasOwnProperty('males')
  const links = []
  const walk = (source, sourceNode) => {    
    for (let name in sourceNode) {
      links.push({ source, target: name })
      if (!isLeaf(sourceNode[name])) {
        walk(name, sourceNode[name])
      }
    }
  }
  walk('root', raw)
  return links
}


function _dataForSankey(nodes, links) {  
  const ob = {
    nodes: nodes.map(n => ({ ...n, fixedValue: 1 })), // `fixedValue`, because all nodes have fixed height
    links: links.map(l => ({ ...l, value: 2 })), // `value: 0`, to start links from a single point
    // value 2 : start from top
    // value 1 : under
    // value 0 : center
  }  
  return ob
}

function _sankey(d3, width, margin, hierarchy, curve, padding, height, dataForSankey) {
  const sankey = d3.sankey()
    .nodeId(d => d.name)
    .nodeAlign(d3.sankeyJustify)
    // the width of the node is the length of the horizontal segment of the route (between the curves)
    .nodeWidth((width - margin.left - margin.right) / (hierarchy.height + 1) * curve)
    .nodePadding(padding)
    .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
  return sankey(dataForSankey)
}


function _routes(sankey) {  
  // Walk recursevly across all the nodes and build all possible
  // routes from the root node to each leaf node
  const walk = n => {
    const subroutes = n.sourceLinks.flatMap(d => walk(d.target))
    return subroutes.length ? subroutes.map(r => [n, ...r]) : [[n]]
  }
  const root = sankey.nodes.find(d => d.targetLinks.length === 0) 
  return walk(root)
}


function _leaves(sankey, targetsAbsolute) {  
  return (
    sankey.nodes
      .filter(n => n.sourceLinks.length === 0)
      .map(n => ({
        node: n,
        targets: targetsAbsolute.filter(t => t.name === n.name)
      }))
  )
}

function _21(md) {
  return (
    md`**Raw data in tree hierarchy format**  
Used to calculate particle distributions`
  )
}

function _hierarchy(d3, raw) {
  const isLeaf = d => d.hasOwnProperty('males')
  // converts an object { bitA, bitB, ... } into array [{ name: 'bitA', ... }, { name: 'bitB', ... }, ...]
  // `d3.hierarchy` will use this array to build its data structure
  const getChildren = ({ name, ...otherProps }) => isLeaf(otherProps) ? undefined // leaves have no children
    : Object.entries(otherProps).map(([name, obj]) => ({ name, ...obj }))  

  const absolutePath = d => `${d.parent ? absolutePath(d.parent) : ''}/${d.data.name}`
  return d3.hierarchy({ name: 'root', ...raw }, getChildren)
    // convert each nodes's data into universal format: `{ name, path, groups: [{ key, value }, ...] }`
    // so it does not depend on exact group names ('males', 'females')
    // later it will allow to reuse the chart with other groups
    .each(d => {
      const datum = {
        name: d.data.name,
        // `path` is needed to distinguish nodes with the same name but different ancestors
        // (e.g. /root/bit501/bit601 vs /root/bit502/bit601)
        path: absolutePath(d),
      }
      if (isLeaf(d.data)) {
        datum.groups = [{
          key: 'males', value: d.data.males
        }, {
          key: 'females', value: d.data.females
        }]
      }
      d.data = datum
    })
}


function _targetsAbsolute(hierarchy) {
  return (
    hierarchy.leaves().flatMap(t => t.data.groups.map(g => ({
      name: t.data.name,
      path: t.data.path,
      group: g.key,
      value: g.value,
    })))
  )
}

function _targets(d3, targetsAbsolute) {
  // normalize values
  const total = d3.sum(targetsAbsolute, d => d.value)
  return targetsAbsolute.map(t => ({ ...t, value: t.value / total }))
}


function _thresholds(d3, targets) {
  return (
    d3.range(targets.length).map(i => d3.sum(targets.slice(0, i + 1).map(r => r.value)))
  )
}

function ___CODE__(md) {
  return (
    md`---
## Code
---`
  )
}

function _targetScale(d3, thresholds, targets) {
  return (
    d3.scaleThreshold()
      .domain(thresholds)
      .range(targets)
  )
}

function _colorScale(d3) {
  const groupTypes = ['females', 'males']  
  return d3.scaleOrdinal()  
    .domain(groupTypes)
    .range(['#83dd83', '#f93ef0'])
    // This is rect particle's color, both are different.
}


function _addParticlesMaybe(density, particles, totalParticles, targetScale, cache, speedScale, colorScale, offsetScale) {
  return (
    (t) => {
      const particlesToAdd = Math.round(Math.random() * density)
      for (let i = 0; i < particlesToAdd; i++) {
        const target = targetScale(Math.random()) // target is an object: { name, path, group }
        const length = cache[target.path].points.length

        const particle = {
          // `id` is needed to distinguish the particles when some of them finish and disappear
          id: `${t}_${i}`,
          speed: speedScale(Math.random()),
          color: colorScale(target.group),
          // used to position a particle vertically on the band
          offset: offsetScale(Math.random()),
          // current position on the route (will be updated in `chart.update`)
          pos: 0,
          // when the particle is appeared
          createdAt: t,
          // total length of the route, used to determine that the particle has arrived
          length,
          // target where the particle is moving
          target,
        }
        particles.push(particle)
      }
    }
  )
}

function _sankeyLinkCustom(d3, bandHeight) {
  return (
    nodes => {
      // you can change curve type at this part.
      const p = d3.path()
      const h = bandHeight / 2
      nodes.forEach((n, i) => {
        if (i === 0) {
          p.moveTo(n.x0, n.y0 + h)
        }
        p.lineTo(n.x1, n.y0 + h)
        const nn = nodes[i + 1]
        if (nn) {
          const w = nn.x0 - n.x1
          p.bezierCurveTo(
            n.x1 + w / 2, n.y0 + h,
            n.x1 + w / 2, nn.y0 + h,
            nn.x0, nn.y0 + h
          )
        }
      })
      return p.toString()
    }
  )
}

function _offsetScale(d3, bandHeight, psize) {
  return (
    d3.scaleLinear()
      .range([-bandHeight / 2 - psize / 2, bandHeight / 2 - psize / 2])
  )
}

function _speedScale(d3, speed) {
  return (
    d3.scaleLinear().range([speed, speed + 0.5])
  )
}

function ___STYLES__(md) {
  return (
    md`---
## Styles
---`
  )
}

function _psize() {
  return (
    7
  )
}

function _curve() {
  return (
    0.6
  )
}

function _margin() {
  // This is Label margin, not whole body
  return (
    { top: 10, right: 120, bottom: 10, left: 10 }
  )
}

function _bandHeight(padding) {
  return (
    80 - padding / 2
  )
}

function _padding() {
  return (
    50
  )
}

function _height(margin, hierarchy, bandHeight, padding) {
  return (
    margin.top + margin.bottom +
    [...new Set(hierarchy.leaves().map(d => d.data.name))].length * (bandHeight + padding / 2) + padding / 2
  )
}

function ___LIBS__(md) {
  return (
    md`---
## Libs
---`
  )
}

function _d3(require) {
  return (
    require('d3@5', 'd3-sankey')    
    // require('d3@5')
  )
}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("title")).define("title", ["md"], _title);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer("viewof reset")).define("viewof reset", ["html"], _reset);
  main.variable(observer("reset")).define("reset", ["Generators", "viewof reset"], (G, _) => G.input(_));
  main.variable(observer("timer")).define("timer", ["chart"], _timer);
  main.variable(observer("speed")).define("speed", _speed);
  main.variable(observer("totalParticles")).define("totalParticles", ["d3", "targetsAbsolute"], _totalParticles);
  main.variable(observer("density")).define("density", _density);
  main.variable(observer("chart")).define("chart", ["d3", "DOM", "width", "height", "margin", "routes", "sankeyLinkCustom", "bandHeight", "cache", "sankey", "leaves", "colorScale", "addParticlesMaybe", "particles", "totalParticles", "psize"], _chart);
  main.variable(observer("cache")).define("cache", _cache);
  main.variable(observer("particles")).define("particles", ["reset"], _particles);
  main.variable(observer("__DATA__")).define("__DATA__", ["md"], ___DATA__);
  main.variable(observer("raw")).define("raw", _raw);
  main.variable(observer()).define(["md"], _14);
  main.variable(observer("nodes")).define("nodes", ["raw"], _nodes);  
  main.variable(observer("links")).define("links", ["raw"], _links);
  main.variable(observer("dataForSankey")).define("dataForSankey", ["nodes", "links"], _dataForSankey);
  main.variable(observer("sankey")).define("sankey", ["d3", "width", "margin", "hierarchy", "curve", "padding", "height", "dataForSankey"], _sankey);
  main.variable(observer("routes")).define("routes", ["sankey"], _routes);
  main.variable(observer("leaves")).define("leaves", ["sankey", "targetsAbsolute"], _leaves);
  main.variable(observer()).define(["md"], _21);
  main.variable(observer("hierarchy")).define("hierarchy", ["d3", "raw"], _hierarchy);
  main.variable(observer("targetsAbsolute")).define("targetsAbsolute", ["hierarchy"], _targetsAbsolute);
  main.variable(observer("targets")).define("targets", ["d3", "targetsAbsolute"], _targets);
  main.variable(observer("thresholds")).define("thresholds", ["d3", "targets"], _thresholds);
  main.variable(observer("__CODE__")).define("__CODE__", ["md"], ___CODE__);
  main.variable(observer("targetScale")).define("targetScale", ["d3", "thresholds", "targets"], _targetScale);
  main.variable(observer("colorScale")).define("colorScale", ["d3"], _colorScale);
  main.variable(observer("addParticlesMaybe")).define("addParticlesMaybe", ["density", "particles", "totalParticles", "targetScale", "cache", "speedScale", "colorScale", "offsetScale"], _addParticlesMaybe);
  main.variable(observer("sankeyLinkCustom")).define("sankeyLinkCustom", ["d3", "bandHeight"], _sankeyLinkCustom);
  main.variable(observer("offsetScale")).define("offsetScale", ["d3", "bandHeight", "psize"], _offsetScale);
  main.variable(observer("speedScale")).define("speedScale", ["d3", "speed"], _speedScale);
  main.variable(observer("__STYLES__")).define("__STYLES__", ["md"], ___STYLES__);
  main.variable(observer("psize")).define("psize", _psize);
  main.variable(observer("curve")).define("curve", _curve);
  main.variable(observer("margin")).define("margin", _margin);
  main.variable(observer("bandHeight")).define("bandHeight", ["padding"], _bandHeight);
  main.variable(observer("padding")).define("padding", _padding);
  main.variable(observer("height")).define("height", ["margin", "hierarchy", "bandHeight", "padding"], _height);
  main.variable(observer("__LIBS__")).define("__LIBS__", ["md"], ___LIBS__);
  // const child1 = runtime.module(define1);
  // main.import("textarea", child1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
