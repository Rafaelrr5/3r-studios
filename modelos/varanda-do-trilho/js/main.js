(function(){
  var d=document;d.documentElement.classList.add('js');

  var els=d.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visto');io.unobserve(e.target);}})},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el)});
  }else{els.forEach(function(el){el.classList.add('visto')})}

  var f=d.getElementById('orcamento');
  if(f){f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var emp=f.empresa.value.trim(),pes=f.pessoas.value.trim(),dt=f.data.value;
    var tipos=[].slice.call(f.querySelectorAll('input[name=tipo]:checked')).map(function(i){return i.value});
    var m='Oi, Varanda do Trilho! Quero fazer uma confraternização aí.';
    if(emp)m+='\nEmpresa/grupo: '+emp;
    if(pes)m+='\nPessoas: cerca de '+pes;
    if(dt){var p=dt.split('-');m+='\nData pensada: '+p[2]+'/'+p[1]+'/'+p[0];}
    if(tipos.length)m+='\nQueremos: '+tipos.join(', ');
    m+='\nPodem me passar um orçamento?';
    window.open('https://wa.me/?text='+encodeURIComponent(m),'_blank','noopener');
  });}
})();
